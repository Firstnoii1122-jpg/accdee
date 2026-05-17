const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isJpeg(buffer) {
  return buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff;
}

function isPng(buffer) {
  return buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a;
}

function isWebp(buffer) {
  return buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
}

function isAllowedImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  return isJpeg(buffer) || isPng(buffer) || isWebp(buffer);
}

function validateSlipImage(file) {
  if (!file) {
    return { ok: false, message: 'กรุณาแนบรูปสลิปการโอนเงิน' };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return { ok: false, message: 'กรุณาอัปโหลดรูปภาพ .jpg, .png หรือ .webp เท่านั้น' };
  }
  if (!isAllowedImageBuffer(file.buffer)) {
    return { ok: false, message: 'ไฟล์สลิปไม่ใช่รูปภาพที่ถูกต้อง' };
  }
  return { ok: true };
}

module.exports = {
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedImageBuffer,
  validateSlipImage,
};
