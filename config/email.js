const nodemailer = require('nodemailer');
const { Resend }  = require('resend');

const sendEmail = async ({ to, subject, html }) => {
  // ลอง Resend ก่อน ถ้ามี key จริง
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !resendKey.includes('{{')) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from   : process.env.EMAIL_FROM || 'Accdee <onboarding@resend.dev>',
        to, subject, html,
      });
      return;
    } catch (err) {
      console.error('Resend error, falling back to Gmail:', err.message);
    }
  }

  // ใช้ Gmail (nodemailer) เป็น fallback หรือ primary
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.warn('Email skipped: no email provider configured');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from   : `"Accdee" <${gmailUser}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error('Gmail send error:', err.message);
  }
};

module.exports = { sendEmail };
