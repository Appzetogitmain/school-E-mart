const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Must match the server's per-file cap (fileStorage.DEFAULT_MAX_BYTES) and the
// submitAssignment validator's 5-file limit. Images are downscaled below, so in practice
// this only bites on large PDFs — which the server would otherwise reject after the
// parent had already waited through the upload.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;

/** Returns an error message if the selection cannot be submitted, else null. */
export const validateSubmissionFiles = (files = []) => {
  if (files.length > MAX_FILES) {
    return `You can attach at most ${MAX_FILES} files.`;
  }

  const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooBig && !tooBig.type.startsWith('image/')) {
    return `"${tooBig.name}" is larger than 5 MB. Please attach a smaller file.`;
  }

  const unsupported = files.find(
    (file) => !file.type.startsWith('image/') && file.type !== 'application/pdf'
  );
  if (unsupported) {
    return `"${unsupported.name}" is not a supported file. Attach a JPG, PNG or PDF.`;
  }

  return null;
};

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

/**
 * Downscale an image to a sane size and re-encode it as JPEG so submissions stay
 * well inside the server's request body budget. Non-images (e.g. PDFs) pass through
 * unchanged.
 */
export const fileToCompressedDataUrl = async (file) => {
  const dataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith('image/')) return dataUrl;

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to load image'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  if (scale === 1 && dataUrl.length < 1_000_000) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

export const filesToCompressedDataUrls = (files = []) =>
  Promise.all(files.map((file) => fileToCompressedDataUrl(file)));
