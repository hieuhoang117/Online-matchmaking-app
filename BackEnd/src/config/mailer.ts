import nodemailer from 'nodemailer';

const port = Number(process.env.SMTP_PORT ?? 587);

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRegistrationOtp = async (to: string, code: string): Promise<void> => {
  const from = process.env.EMAIL_USER;
  if (!process.env.SMTP_HOST || !from || !process.env.EMAIL_PASS) {
    throw new Error('Cấu hình SMTP chưa đầy đủ');
  }

  await mailer.sendMail({
    from,
    to,
    subject: 'Mã xác minh đăng ký',
    text: `Mã OTP của bạn là ${code}. Mã có hiệu lực trong 5 phút.`,
  });
};