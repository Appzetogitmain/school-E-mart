const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const DATA_URI_PATTERN = /^data:(image\/(?:png|jpe?g|webp|gif)|application\/pdf);base64,(.+)$/;

const EXTENSION_BY_MIME = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

/**
 * Persist a base64 data URI under /uploads and return its public path.
 * Returns already-stored paths untouched so callers can pass through existing values.
 * Returns null when the input is not a data URI we accept.
 */
const saveBase64File = (value, prefix = 'file', { maxBytes = 5 * 1024 * 1024 } = {}) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('/uploads/')) return value;

  const match = value.match(DATA_URI_PATTERN);
  if (!match) return null;

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > maxBytes) return null;

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const ext = EXTENSION_BY_MIME[mime] || 'bin';
  const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

  return `/uploads/${filename}`;
};

const saveBase64Files = (values = [], prefix = 'file', options = {}) =>
  (Array.isArray(values) ? values : [])
    .map((value) => saveBase64File(value, prefix, options))
    .filter(Boolean);

module.exports = {
  saveBase64File,
  saveBase64Files,
  UPLOADS_DIR,
};
