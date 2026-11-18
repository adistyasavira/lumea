/**
 * LUMÉA — Fallback when the camera is unavailable: load a photo file with its EXIF
 * orientation applied.
 */

const IMAGE_TYPE_PREFIX = 'image/';

/**
 * Decodes an image file into an ImageBitmap.
 * @param {File} file
 * @returns {Promise<ImageBitmap>}
 * @throws {Error} when the file is not an image
 */
export async function loadImageFile(file) {
  if (!file || !file.type.startsWith(IMAGE_TYPE_PREFIX)) {
    throw new Error('File yang dipilih bukan gambar.');
  }
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}
