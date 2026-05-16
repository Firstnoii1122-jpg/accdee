const db           = require('../config/db');
const { sendNotify } = require('../config/telegram');

// POST /api/telegram/webhook — รับข้อความจาก AccdeeNotifyBot
const handleWebhook = async (req, res) => {
  // Fail-secure: ถ้าไม่ได้ตั้ง TELEGRAM_WEBHOOK_SECRET → reject ทุก request
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incoming       = req.headers['x-telegram-bot-api-secret-token'];
  if (!expectedSecret || incoming !== expectedSecret) {
    return res.status(403).end();
  }

  // ตอบ Telegram ทันทีเพื่อไม่ให้ timeout (Telegram รอแค่ 10 วิ)
  res.json({ ok: true });

  const update = req.body;
  if (!update.message) return;

  const msg    = update.message;
  const chatId = msg.chat.id;
  const text   = (msg.text || '').trim();

  // /start — แนะนำวิธีใช้
  if (text === '/start' || text.startsWith('/start ')) {
    sendNotify(chatId,
      `👋 <b>สวัสดีครับ! ACCDEE Notify Bot</b>\n\n` +
      `บอทนี้ใช้สำหรับรับแจ้งเตือนเมื่อ:\n` +
      `• ✅ เติมเงินได้รับการอนุมัติ\n` +
      `• ❌ คำขอเติมเงินถูกปฏิเสธ\n\n` +
      `<b>วิธีเชื่อมต่อบัญชี ACCDEE:</b>\n` +
      `ส่งคำสั่ง: <code>/link อีเมลที่สมัคร</code>\n` +
      `ตัวอย่าง: <code>/link user@gmail.com</code>`
    );
    return;
  }

  // /link email@example.com — เชื่อมบัญชีกับ chat_id นี้
  if (text.startsWith('/link ')) {
    const email = text.slice(6).trim().toLowerCase();

    if (!email || !email.includes('@')) {
      sendNotify(chatId, '❌ รูปแบบไม่ถูกต้อง กรุณาส่ง: <code>/link อีเมลของคุณ</code>');
      return;
    }

    const [rows] = await db.execute(
      "SELECT id, username FROM users WHERE LOWER(email) = ? AND role = 'user'",
      [email]
    );

    if (!rows.length) {
      sendNotify(chatId,
        `❌ ไม่พบบัญชีที่ใช้อีเมล <code>${email}</code>\n` +
        `กรุณาตรวจสอบอีเมลที่ใช้สมัคร ACCDEE`
      );
      return;
    }

    const user = rows[0];
    await db.execute('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [String(chatId), user.id]);

    sendNotify(chatId,
      `✅ <b>เชื่อมต่อสำเร็จ!</b>\n\n` +
      `สวัสดีคุณ <b>${user.username}</b> 👋\n` +
      `ตั้งแต่นี้คุณจะได้รับแจ้งเตือนผ่าน Telegram\n` +
      `เมื่อมีการเติมเงินเข้ากระเป๋าของคุณ`
    );
    return;
  }

  // ข้อความอื่นๆ — แนะนำคำสั่ง
  sendNotify(chatId,
    `ไม่เข้าใจคำสั่งนี้ครับ\n\n` +
    `คำสั่งที่ใช้ได้:\n` +
    `• <code>/start</code> — แสดงวิธีใช้\n` +
    `• <code>/link อีเมล</code> — เชื่อมต่อบัญชี ACCDEE`
  );
};

module.exports = { handleWebhook };
