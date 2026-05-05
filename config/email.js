const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD not set');
    return;
  }

  await transporter.sendMail({
    from: `"Accdee" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = { sendEmail };
