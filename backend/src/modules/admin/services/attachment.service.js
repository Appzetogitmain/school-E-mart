const Attachment = require('../../../database/models/Attachment');
const { BadRequestError } = require('../../../common/errors');
const { savePrivateBase64Files, DEFAULT_MAX_BYTES } = require('../../../utils/fileStorage');

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
  // Vendor KYC paperwork, uploaded during onboarding.
  'kyc_doc',
  // Profile photos (teacher/parent/etc.) — was present on the Attachment
  // model's purpose enum but missing here, so every avatar upload 400'd.
  'profile_avatar',
  // "Learn more about platform" tutorial videos (admin console).
  'tutorial_video',
  'tutorial_thumb',
  // RFQ uniform-set reference images (design/logo/fabric photos), uploaded
  // by a school when creating/editing a quotation request.
  'rfq_attachment',
]);

// Purposes whose bytes live outside the statically-served /uploads dir and are only
// readable through an authorized stream endpoint.
const PRIVATE_PURPOSES = new Set(['submission', 'homework_attachment']);

const REJECTION_MESSAGES = {
  FILE_TOO_LARGE: `File is larger than ${Math.round(DEFAULT_MAX_BYTES / (1024 * 1024))} MB`,
  UNSUPPORTED_FILE_TYPE: 'Only JPG, PNG, WEBP, GIF or PDF files are accepted',
  EMPTY_FILE: 'File is empty or unreadable',
};

const attachmentService = {
  PRIVATE_PURPOSES,

  async createFromUpload({ ownerUserId, purpose, file }) {
    if (!ALLOWED_PURPOSES.has(purpose)) {
      throw new BadRequestError('Invalid upload purpose', null, 'INVALID_UPLOAD_PURPOSE');
    }

    if (!file) {
      throw new BadRequestError('No file uploaded', null, 'NO_FILE');
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

  /**
   * Store base64 data URIs privately and record them as Attachments.
   * Rejects the whole batch if any file is unusable: a partial submission would leave
   * the parent thinking work was handed in that the teacher can never see.
   */
  async createManyFromBase64({ ownerUserId, purpose, files = [], prefix = 'file', maxBytes }) {
    if (!PRIVATE_PURPOSES.has(purpose)) {
      throw new BadRequestError('Invalid upload purpose', null, 'INVALID_UPLOAD_PURPOSE');
    }
    if (!files.length) return [];

    const { saved, rejected } = savePrivateBase64Files(files, prefix, { maxBytes });

    if (rejected.length) {
      const detail = rejected
        .map(({ index, error }) => `File ${index + 1}: ${REJECTION_MESSAGES[error] || error}`)
        .join('; ');
      // BadRequestError takes (message, errors, code) — the code is the third argument.
      throw new BadRequestError(detail, null, 'UPLOAD_REJECTED');
    }

    return Attachment.insertMany(
      saved.map(({ storageKey, mime, sizeBytes }) => ({
        ownerUserId,
        purpose,
        storageKey,
        mime,
        sizeBytes,
        scanStatus: 'clean',
      }))
    );
  },
};

module.exports = attachmentService;
