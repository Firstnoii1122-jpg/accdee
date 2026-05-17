function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
}

function maskEmail(email = '') {
  const [name, domain] = String(email).toLowerCase().split('@');
  if (!name || !domain) return 'unknown';
  return `${name.slice(0, 2)}***@${domain}`;
}

function logSecurityEvent(event, req, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    event,
    ip: getClientIp(req),
    method: req.method,
    path: req.originalUrl || req.url,
    userAgent: req.headers['user-agent'] || 'unknown',
    ...details,
  };
  console.warn(JSON.stringify(entry));
}

module.exports = { logSecurityEvent, maskEmail };

