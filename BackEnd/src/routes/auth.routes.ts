import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Công khai
router.post('/registrations', authController.register);
router.post('/registrations/otp-verifications', authController.verifyRegisterOtp);
router.post('/email-availability', authController.checkEmail);
router.post('/password-resets', authController.requestPasswordResetOtp);
router.post('/password-resets/otp-verifications', authController.resetPassword);
router.post('/sessions', authController.login);
router.post('/admins/sessions', authController.adminLogin);
router.post('/sessions/current/refreshes', authController.refresh);
router.post('/sessions/current/revocations', authController.logout);

// Cần đăng nhập
router.post('/sessions/revocations', verifyToken, authController.logoutAll);

// Route thử phân quyền, xoá sau khi test xong
router.get('/admins/status', verifyToken, authorize('admin'), (_req, res) => {
  res.json({ message: 'Xin chào admin' });
});

export default router;