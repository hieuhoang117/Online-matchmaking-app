import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export type Role = 'user' | 'admin';

export interface AuthUser {
  id: string;
  role: Role;
}

export const signAccessToken = (account: AuthUser): string =>
  jwt.sign({ id: account.id, role: account.role }, env.accessSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessExpires as SignOptions['expiresIn'],
  });

// Ném lỗi nếu token sai, hết hạn hoặc payload không đúng dạng
export const verifyAccessToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, env.accessSecret, { algorithms: ['HS256'] }) as JwtPayload;
  if (typeof decoded.id !== 'string' || (decoded.role !== 'user' && decoded.role !== 'admin')) {
    throw new Error('Payload token không hợp lệ');
  }
  return { id: decoded.id, role: decoded.role };
};

// Refresh token là chuỗi ngẫu nhiên, không phải JWT
export const generateRefreshToken = (): string => crypto.randomBytes(48).toString('hex');

// DB chỉ lưu hash của refresh token
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');