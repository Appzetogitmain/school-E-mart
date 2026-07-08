const Attachment = require('../../../database/models/Attachment');
const { BadRequestError } = require('../../../common/errors');

const ALLOWED_PURPOSES = new Set([
  'banner_image',
  'reel_video',
  'reel_thumb',
  'lms_video',
  'lms_thumb',
  'product_image',
  'category_image',
  'kit_image',
  'notice_attachment',
]);

const attachmentService = {
  async createFromUpload({ ownerUserId, purpose, file }) {
    if (!ALLOWED_PURPOSES.has(purpose)) {
      throw new BadRequestError('Invalid upload purpose', 'INVALID_UPLOAD_PURPOSE');
    }

    if (!file) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }

    const storageKey = `/uploads/${file.filename}`;

    const attachment = await Attachment.create({
      ownerUserId,
      purpose,
      storageKey,
      mime: file.mimetype,
      sizeBytes: file.size,
      scanStatus: 'clean',
    });

    return {
      ...attachment.toObject(),
      url: storageKey,
    };
  },
};

module.exports = attachmentService;
