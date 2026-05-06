const { Resend } = require('resend');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email skipped: RESEND_API_KEY not set');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from   : process.env.EMAIL_FROM || 'Accdee <onboarding@resend.dev>',
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendEmail };
