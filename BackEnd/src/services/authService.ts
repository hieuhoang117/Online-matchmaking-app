import bcrypt from 'bcrypt';
import { createHash, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
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
  username: string;
  displayName: string;
  email: string;
  password: string;
  dateOfBirth: string; // YYYY-MM-DD
}

interface PreparedRegistration {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
}

interface PendingRegistration {
  registration: PreparedRegistration;
  otpHash: string;
}

interface PendingRegistrationState {
  pending: PendingRegistration;
  attempts: number;
  expiresAt: number;
  resendAt: number;
}

const OTP_TTL_SECONDS = 5 * 60;
const OTP_RESEND_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const pendingRegistrations = new Map<string, PendingRegistrationState>();

const prepareRegistration = async (input: RegisterInput): Promise<PreparedRegistration> => {
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim().replace(/\s+/g, ' ');
  const email = input.email.trim().toLowerCase();
  const dateOfBirth = input.dateOfBirth.trim();

  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    throw new HttpError(400, 'Tên đăng nhập phải từ 3 đến 30 ký tự gồm chữ thường, số, dấu _ hoặc .');
  }
  if (!displayName || displayName.length > 50) {
    throw new HttpError(400, 'Tên hiển thị phải từ 1 đến 50 ký tự');
  }
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
  const existingUsername = await prisma.users.findUnique({ where: { username } });
  if (existingUsername) {
    throw new HttpError(409, 'Tên đăng nhập đã được sử dụng');
  }

  return {
    username,
    displayName,
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
        const target = JSON.stringify((error as { meta?: unknown }).meta ?? '');
        throw new HttpError(
          409,
          target.includes('username') ? 'Tên đăng nhập đã được sử dụng' : 'Email đã được sử dụng',
        );
      }
      throw error;
    });

  const tokens = await issueTokens({ id: user.userId, role: 'user' });
  return { user: publicUser(user), ...tokens };
};

export const requestRegisterOtp = async (input: RegisterInput) => {
  const registration = await prepareRegistration(input);
  const email = registration.email;
  const now = Date.now();
  const existing = pendingRegistrations.get(email);
  if (existing && existing.resendAt > now) {
    throw new HttpError(429, 'Vui lòng chờ trước khi yêu cầu gửi lại OTP');
  }

  const otp = randomInt(100000, 1000000).toString();
  const state: PendingRegistrationState = {
    pending: {
      registration,
      otpHash: createHash('sha256').update(otp).digest('hex'),
    },
    attempts: 0,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAt: now + OTP_RESEND_SECONDS * 1000,
  };
  pendingRegistrations.set(email, state);

  try {
    await sendRegistrationOtp(email, otp);
  } catch (error) {
    if (pendingRegistrations.get(email) === state) pendingRegistrations.delete(email);
    throw error;
  }

  return { email };
};

export const verifyRegisterOtp = async (emailInput: string, otp: string) => {
  const email = emailInput.trim().toLowerCase();
  const state = pendingRegistrations.get(email);
  if (!state || state.expiresAt <= Date.now()) {
    pendingRegistrations.delete(email);
    throw new HttpError(400, 'OTP không hợp lệ hoặc đã hết hạn');
  }
  if (!/^\d{6}$/.test(otp)) throw new HttpError(400, 'OTP phải gồm 6 chữ số');

  state.attempts++;
  if (state.attempts > MAX_OTP_ATTEMPTS) {
    pendingRegistrations.delete(email);
    throw new HttpError(429, 'Bạn đã nhập sai OTP quá số lần cho phép');
  }

  const submittedHash = createHash('sha256').update(otp).digest();
  const expectedHash = Buffer.from(state.pending.otpHash, 'hex');
  if (!timingSafeEqual(submittedHash, expectedHash)) {
    throw new HttpError(400, 'OTP không chính xác');
  }

  pendingRegistrations.delete(email);
  return createRegisteredUser(state.pending.registration);
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