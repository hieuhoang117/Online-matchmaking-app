import { Router } from 'express';
import { getMyProfile, updateMyProfile, getInterestByCategoryController } from '../controllers/profileController.js';
import { authorize, verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', verifyToken, authorize('user'), getMyProfile);
router.patch('/me', verifyToken, authorize('user'), updateMyProfile);
router.get('/interests', verifyToken, authorize('user'), getInterestByCategoryController);

export default router;