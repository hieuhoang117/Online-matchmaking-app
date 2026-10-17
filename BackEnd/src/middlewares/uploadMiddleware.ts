import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),        // giữ file trong RAM, chưa ghi ra đĩa
  limits: { fileSize: 5 * 1024 * 1024 },  // tối đa 5MB
});