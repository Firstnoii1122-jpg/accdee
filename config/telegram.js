const https = require('https');

// ส่งข้อความหาเจ้าของร้าน (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
const sendTelegram = (message) => {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  _send(token, chatId, message);
};

// ส่งข้อความหาลูกค้าโดยตรง (TELEGRAM_NOTIFY_BOT_TOKEN + chatId ของลูกค้า)
const sendNotify = (chatId, message) => {
  const token = process.env.TELEGRAM_NOTIFY_BOT_TOKEN;
  if (!token || !chatId) return;
  _send(token, String(chatId), message);
};

function _send(token, chatId, message) {
  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
  const req  = https.request({
    hostname: 'api.telegram.org',
    path    : `/bot${token}/sendMessage`,
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' }
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

module.exports = { sendTelegram, sendNotify };
