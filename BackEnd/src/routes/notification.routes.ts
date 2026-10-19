import { Router } from 'express';
import { getNotifications } from '../controllers/notificationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', verifyToken, getNotifications);

export default router;