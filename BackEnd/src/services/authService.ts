import bcrypt from 'bcrypt';
import { createHash, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import redis from '../config/redis.js';
import { sendRegistrationOtp } from '../config/mailer.js';
import { HttpError } from '../utils/httpError.js';
import { AuthUser, Role, signAccessToken, generateRefreshToken, hashToken } from '../utils/jwt.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt chỉ đọc 72 byte đầu
const MIN_AGE = 18;

// Hash giả để thời gian phản hồi giống nhau dù email có tồn tại hay không
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

const isAdult = (dob: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== dob) return false;

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age >= MIN_AGE;
};

const publicUser = <T extends { passwordHash: string }>(u: T) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

// Tạo cặp token mới, lưu hash của refresh token vào DB
const issueTokens = async (account: AuthUser) => {
  const accessToken = signAccessToken(account);
  const refreshToken = generateRefreshToken();

  await prisma.refresh_tokens.create({
    data: {
      tokenId: randomUUID(),
      accountId: account.id,
      accountType: account.role,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshDays * DAY_MS),
    },
  });

  return { accessToken, refreshToken };
};

const revokeAll = (accountId: string, accountType: Role) =>
  prisma.refresh_tokens.updateMany({
    where: { accountId, accountType, revokedAt: null },
    data: { revokedAt: new Date() },
  });

// Tải lại tài khoản khi refresh để chặn tài khoản đã bị khoá hoặc xoá
const loadAccount = async (accountId: string, type: Role): Promise<AuthUser | null> => {
  if (type === 'admin') {
    const admin = await prisma.admins.findUnique({ where: { adminID: accountId } });
    return admin ? { id: admin.adminID, role: 'admin' } : null;
  }
  const user = await prisma.users.findUnique({ where: { userId: accountId } });
  return user && user.status === 'active' ? { id: user.userId, role: 'user' } : null;
};

// ---------- Đăng ký ----------
export interface RegisterInput {
  email: string;
  password: string;
  dateOfBirth: string; // YYYY-MM-DD
}

interface PreparedRegistration {
  email: string;
  passwordHash: string;
  dateOfBirth: string;
}

interface PendingRegistration {
  registration: PreparedRegistration;
  otpHash: string;
}

const OTP_TTL_SECONDS = 5 * 60;
const OTP_RESEND_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const registrationOtpKey = (email: string) => `register:otp:${email}`;
const registrationAttemptsKey = (email: string) => `register:otp:attempts:${email}`;
const registrationCooldownKey = (email: string) => `register:otp:cooldown:${email}`;

const prepareRegistration = async (input: RegisterInput): Promise<PreparedRegistration> => {
  const email = input.email.trim().toLowerCase();
  const dateOfBirth = input.dateOfBirth.trim();

  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Email không hợp lệ');
  }
  if (input.password.length < MIN_PASSWORD || input.password.length > MAX_PASSWORD) {
    throw new HttpError(400, `Mật khẩu phải từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự`);
  }
  if (!isAdult(dateOfBirth)) {
    throw new HttpError(400, `Ngày sinh không hợp lệ hoặc chưa đủ ${MIN_AGE} tuổi`);
  }

  const existingEmail = await prisma.users.findUnique({ where: { email } });
  if (existingEmail) {
    throw new HttpError(409, 'Email đã được sử dụng');
  }

  return {
    email,
    passwordHash: await bcrypt.hash(input.password, 10),
    dateOfBirth,
  };
};

const createRegisteredUser = async (registration: PreparedRegistration) => {
  const user = await prisma.users
    .create({ data: { userId: randomUUID(), ...registration } })
    .catch((error: unknown) => {
      if ((error as { code?: string }).code === 'P2002') {
        throw new HttpError(409, 'Email đã được sử dụng');
      }
      throw error;
    });

  const tokens = await issueTokens({ id: user.userId, role: 'user' });
  return { user: publicUser(user), ...tokens };
};

export const requestRegisterOtp = async (input: RegisterInput) => {
  const registration = await prepareRegistration(input);
  const email = registration.email;
  const cooldownKey = registrationCooldownKey(email);
  const cooldownSet = await redis.set(cooldownKey, '1', { NX: true, EX: OTP_RESEND_SECONDS });

  if (cooldownSet !== 'OK') {
    throw new HttpError(429, 'Vui lòng chờ trước khi yêu cầu gửi lại OTP');
  }

  const otp = randomInt(100000, 1000000).toString();
  const pending: PendingRegistration = {
    registration,
    otpHash: createHash('sha256').update(otp).digest('hex'),
  };
  const otpKey = registrationOtpKey(email);
  const attemptsKey = registrationAttemptsKey(email);

  try {
    await redis.set(otpKey, JSON.stringify(pending), { EX: OTP_TTL_SECONDS });
    await redis.set(attemptsKey, '0', { EX: OTP_TTL_SECONDS });
    await sendRegistrationOtp(email, otp);
  } catch (error) {
    await Promise.all([redis.del(otpKey), redis.del(attemptsKey), redis.del(cooldownKey)]);
    throw error;
  }

  return { email };
};

export const verifyRegisterOtp = async (emailInput: string, otp: string) => {
  const email = emailInput.trim().toLowerCase();
  const otpKey = registrationOtpKey(email);
  const attemptsKey = registrationAttemptsKey(email);
  const cooldownKey = registrationCooldownKey(email);
  const pendingValue = await redis.get(otpKey);

  if (!pendingValue) throw new HttpError(400, 'OTP không hợp lệ hoặc đã hết hạn');
  if (!/^\d{6}$/.test(otp)) throw new HttpError(400, 'OTP phải gồm 6 chữ số');

  const attempts = await redis.incr(attemptsKey);
  if (attempts > MAX_OTP_ATTEMPTS) {
    await Promise.all([redis.del(otpKey), redis.del(attemptsKey), redis.del(cooldownKey)]);
    throw new HttpError(429, 'Bạn đã nhập sai OTP quá số lần cho phép');
  }

  const pending = JSON.parse(pendingValue) as PendingRegistration;
  const submittedHash = createHash('sha256').update(otp).digest();
  const expectedHash = Buffer.from(pending.otpHash, 'hex');
  if (!timingSafeEqual(submittedHash, expectedHash)) {
    throw new HttpError(400, 'OTP không chính xác');
  }

  await Promise.all([redis.del(otpKey), redis.del(attemptsKey), redis.del(cooldownKey)]);
  return createRegisteredUser(pending.registration);
};

// ---------- Đăng nhập ----------
export const login = async (email: string, password: string) => {
  const user = await prisma.users.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Luôn chạy bcrypt.compare, kể cả khi không có user, để không lộ email nào tồn tại
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');
  if (user.status !== 'active') throw new HttpError(403, 'Tài khoản đã bị khoá');

  const tokens = await issueTokens({ id: user.userId, role: 'user' });
  return { user: publicUser(user), ...tokens };
};

export const adminLogin = async (username: string, password: string) => {
  const admin = await prisma.admins.findUnique({ where: { username: username.trim() } });

  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) throw new HttpError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');

  const tokens = await issueTokens({ id: admin.adminID, role: 'admin' });
  return { admin: { adminID: admin.adminID, username: admin.username }, ...tokens };
};

// ---------- Refresh (xoay vòng token) ----------
export const refresh = async (refreshToken: string) => {
  const record = await prisma.refresh_tokens.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!record) throw new HttpError(401, 'Refresh token không hợp lệ');

  // Thu hồi token cũ, chỉ thành công nếu nó chưa bị thu hồi
  const revoked = await prisma.refresh_tokens.updateMany({
    where: { tokenId: record.tokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  // Token đã thu hồi mà có người dùng lại -> nghi bị đánh cắp, đăng xuất mọi thiết bị
  if (revoked.count === 0) {
    await revokeAll(record.accountId, record.accountType);
    throw new HttpError(401, 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại');
  }

  if (record.expiresAt < new Date()) {
    throw new HttpError(401, 'Phiên đăng nhập đã hết hạn');
  }

  const account = await loadAccount(record.accountId, record.accountType);
  if (!account) throw new HttpError(403, 'Tài khoản không khả dụng');

  return issueTokens(account);
};

// ---------- Đăng xuất ----------
export const logout = async (refreshToken: string) => {
  await prisma.refresh_tokens.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const logoutAll = async (account: AuthUser) => {
  await revokeAll(account.id, account.role);
};