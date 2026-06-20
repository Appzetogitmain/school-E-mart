const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const getRequestMeta = (req) => ({
  requestId: req.requestId || req.correlationId || null,
  ipAddress: getClientIp(req),
  userAgent: req.headers['user-agent'] || null,
  method: req.method,
  path: req.originalUrl,
});

module.exports = {
  getClientIp,
  getRequestMeta,
};
