import { Router } from 'express';
import { uploadAvatar, deleteAvatar } from '../../controllers/uploadController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';
import { upload } from '../../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar,);
router.delete('/avatar', verifyToken, deleteAvatar,);

export default router;