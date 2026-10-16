import { Request, Response, NextFunction } from 'express';
import { AuthUser, verifyAccessToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    req.user = verifyAccessToken(header.split(' ')[1]);
    next();
  } catch (error) {
    const expired = error instanceof Error && error.name === 'TokenExpiredError';
    // 401 để app biết cần gọi /refresh
    return res.status(401).json({
      message: expired ? 'Token đã hết hạn' : 'Token không hợp lệ',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }
};

// Phân quyền: authorize('admin', 'moderator')
export const authorize =
  (...roles: AuthUser['role'][]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không đủ quyền' });
    }
    next();
  };