import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const sendError = (res: Response, error: unknown) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: 'Lỗi máy chủ' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const b = req.body ?? {};
    if (typeof b.email !== 'string' || typeof b.password !== 'string') {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }
    const data = await authService.register({
      email: b.email,
      password: b.password,
      phoneNumber: str(b.phoneNumber),
      dateOfBirth: str(b.dateOfBirth),
      gender: str(b.gender),
      targetGender: str(b.targetGender),
      bio: str(b.bio),
    });
    res.status(201).json({ message: 'Đăng ký thành công', data });
  } catch (error) {
    sendError(res, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }
    const data = await authService.login(email, password);
    res.status(200).json({ message: 'Đăng nhập thành công', data });
  } catch (error) {
    sendError(res, error);
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }
    const data = await authService.adminLogin(username, password);
    res.status(200).json({ message: 'Đăng nhập admin thành công', data });
  } catch (error) {
    sendError(res, error);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (typeof refreshToken !== 'string') {
      return res.status(400).json({ message: 'Thiếu refreshToken' });
    }
    const data = await authService.refresh(refreshToken);
    res.status(200).json({ data });
  } catch (error) {
    sendError(res, error);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (typeof refreshToken === 'string') await authService.logout(refreshToken);
    res.status(200).json({ message: 'Đã đăng xuất' });
  } catch (error) {
    sendError(res, error);
  }
};

export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    await authService.logoutAll(req.user!);
    res.status(200).json({ message: 'Đã đăng xuất khỏi mọi thiết bị' });
  } catch (error) {
    sendError(res, error);
  }
};