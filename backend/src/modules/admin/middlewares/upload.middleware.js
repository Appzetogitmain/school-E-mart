const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { UPLOADS_DIR } = require('../../../utils/fileStorage');

// Single source of truth for where public uploads live, so a configured UPLOADS_DIR
// moves multer, the base64 writer, and the static mount together.
const UPLOAD_DIR = UPLOADS_DIR;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }
  cb(new Error('Only image files are allowed'));
};

const mediaFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
    return;
  }
  cb(new Error('Only image or video files are allowed'));
};

// KYC paperwork is routinely a scanned PDF, so documents accept more than images.
const documentFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
    return;
  }
  cb(new Error('Only image or PDF files are allowed'));
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: imageFilter,
}).single('file');

const PlatformSettings = require('../../../database/models/PlatformSettings');

const getMaxMediaSizeBytes = async () => {
  try {
    const settings = await PlatformSettings.findById('default').lean();
    const mb = settings?.lms?.maxVideoSizeMB || 500;
    return mb * 1024 * 1024;
  } catch {
    return 500 * 1024 * 1024;
  }
};

const uploadMedia = (req, res, next) => {
  getMaxMediaSizeBytes()
    .then((maxBytes) => {
      multer({
        storage,
        limits: { fileSize: maxBytes },
        fileFilter: mediaFilter,
      }).single('file')(req, res, next);
    })
    .catch(() => {
      multer({
        storage,
        limits: { fileSize: 500 * 1024 * 1024 },
        fileFilter: mediaFilter,
      }).single('file')(req, res, next);
    });
};

const uploadDocument = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: documentFilter,
}).single('file');

module.exports = {
  uploadImage,
  uploadMedia,
  uploadDocument,
  UPLOAD_DIR,
};
