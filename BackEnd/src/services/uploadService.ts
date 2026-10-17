import cloudinary from '../config/cloudinary.js';

export const uploadImageToCloudinary = (fileBuffer: Buffer, folder = 'avatars'): Promise<any> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });

export const deleteImageFromCloudinary = (publicId: string) =>
  cloudinary.uploader.destroy(publicId);