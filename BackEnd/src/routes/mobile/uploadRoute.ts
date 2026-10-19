import { Router } from 'express';
import { uploadAvatar, deleteAvatar } from '../../controllers/uploadController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';
import { upload } from '../../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/avatars', verifyToken, upload.single('avatar'), uploadAvatar);
router.delete('/avatars', verifyToken, deleteAvatar);

export default router;