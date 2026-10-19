import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { getNotificationsByUserId } from '../services/notificationService.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await getNotificationsByUserId(req.user!.id);

    return res.status(200).json({ data: notifications });
  } catch {
    return res.status(500).json({ message: 'Không thể lấy danh sách thông báo' });
  }
};