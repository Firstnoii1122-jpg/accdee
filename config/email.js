const { Resend } = require('resend');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email skipped: RESEND_API_KEY not set');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from   : 'Accdee <onboarding@resend.dev>',
    to,
    subject,
    html
  });
};

module.exports = { sendEmail };
