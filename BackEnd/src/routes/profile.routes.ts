import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/profileController.js';
import { authorize, verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', verifyToken, authorize('user'), getMyProfile);
router.patch('/me', verifyToken, authorize('user'), updateMyProfile);

export default router;