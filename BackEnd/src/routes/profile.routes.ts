import { Router } from 'express';
import { getMyProfile, updateMyProfile, getInterestByCategoryController, createInterestController, addUserInterestController } from '../controllers/profileController.js';
import { authorize, verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', verifyToken, authorize('user'), getMyProfile);
router.patch('/me', verifyToken, authorize('user'), updateMyProfile);
router.get('/interests', verifyToken, authorize('user'), getInterestByCategoryController);
router.post('/interests', verifyToken, authorize('user'), createInterestController);
router.post('/user-interests', verifyToken, authorize('user'), addUserInterestController);

export default router;