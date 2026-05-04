const https = require('https');

const sendTelegram = (message) => {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });

  const req = https.request({
    hostname: 'api.telegram.org',
    path    : `/bot${token}/sendMessage`,
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' }
  });

  req.on('error', () => {});
  req.write(body);
  req.end();
};

module.exports = { sendTelegram };
