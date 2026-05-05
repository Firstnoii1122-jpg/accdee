const nodemailer = require('nodemailer');

// ใช้ Resend SMTP — สมัครฟรีที่ resend.com แล้วใส่ RESEND_API_KEY ใน Railway
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY
  }
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Email skipped: RESEND_API_KEY not set');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Accdee" <${process.env.EMAIL_FROM || 'noreply@accdee.shop'}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendEmail };
