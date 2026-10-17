import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Công khai
router.post('/register', authController.register);
router.post('/register/verify-otp', authController.verifyRegisterOtp);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Cần đăng nhập
router.post('/logout-all', verifyToken, authController.logoutAll);

// Route thử phân quyền, xoá sau khi test xong
router.get('/admin/ping', verifyToken, authorize('admin'), (_req, res) => {
  res.json({ message: 'Xin chào admin' });
});

export default router;