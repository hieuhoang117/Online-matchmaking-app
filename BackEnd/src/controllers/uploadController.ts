import{uploadImageToCloudinary,deleteImageFromCloudinary} from '../services/uploadService.js'
import type { Request, Response } from 'express';

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file được gửi lên' });

    const result = await uploadImageToCloudinary(req.file.buffer, 'avatars');
    res.status(200).json({
      message: 'Upload thành công',
      data: { url: result.secure_url, public_id: result.public_id },
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload thất bại' });
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId không được cung cấp' });

    await deleteImageFromCloudinary(publicId);
    res.status(200).json({ message: 'Xóa ảnh đại diện thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Xóa ảnh đại diện thất bại' });
  }
};