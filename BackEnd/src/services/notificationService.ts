import prisma from '../config/db.js';

export const getNotificationsByUserId = (userId: string) =>
  prisma.notifications.findMany({
    where: { recipientID: userId },
  });
