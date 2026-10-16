import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { AuthUser, Role, signAccessToken, generateRefreshToken, hashToken } from '../utils/jwt.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt chỉ đọc 72 byte đầu
const MIN_AGE = 18;

// Hash giả để thời gian phản hồi giống nhau dù email có tồn tại hay không
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

// ---------- Hàm phụ ----------
const clean = (v?: string): string | null => {
  const t = v?.trim();
  return t ? t : null; // chuỗi rỗng -> null, tránh trùng UNIQUE của phoneNumber
};

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
  phoneNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string;
  targetGender?: string;
  bio?: string;
}

export const register = async (input: RegisterInput) => {
  const email = input.email.trim().toLowerCase();
  const phoneNumber = clean(input.phoneNumber);
  const dateOfBirth = clean(input.dateOfBirth);

  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Email không hợp lệ');
  }
  if (input.password.length < MIN_PASSWORD || input.password.length > MAX_PASSWORD) {
    throw new HttpError(400, `Mật khẩu phải từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự`);
  }
  if (phoneNumber && phoneNumber.length > 20) {
    throw new HttpError(400, 'Số điện thoại không hợp lệ');
  }
  if (dateOfBirth && !isAdult(dateOfBirth)) {
    throw new HttpError(400, `Ngày sinh không hợp lệ hoặc chưa đủ ${MIN_AGE} tuổi`);
  }

  const user = await prisma.users
    .create({
      data: {
        userId: randomUUID(),
        email,
        passwordHash: await bcrypt.hash(input.password, 10),
        phoneNumber,
        dateOfBirth,
        gender: clean(input.gender),
        targetGender: clean(input.targetGender),
        bio: clean(input.bio),
      },
    })
    .catch((error: unknown) => {
      if ((error as { code?: string }).code === 'P2002') {
        throw new HttpError(409, 'Email hoặc số điện thoại đã được sử dụng');
      }
      throw error;
    });

  const tokens = await issueTokens({ id: user.userId, role: 'user' });
  return { user: publicUser(user), ...tokens };
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