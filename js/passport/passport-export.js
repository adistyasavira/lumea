/**
 * LUMÉA — Exports the passport card to a 1080 × 1920 PNG with html2canvas
 * (loaded from cdnjs in index.html), then downloads or shares it.
 */
import { APP_CONFIG } from '../config/app-config.js';

const PNG_TYPE = 'image/png';
const PNG_EXTENSION = '.png';

/**
 * Whether html2canvas has loaded.
 * @returns {boolean}
 */
export function isExportAvailable() {
  return typeof globalThis.html2canvas === 'function';
}

/**
 * File name for a passport, e.g. lumea-color-passport-LM-261117-042.png.
 * @param {string} passportId
 * @returns {string}
 */
export function buildFileName(passportId) {
  return `${APP_CONFIG.passport.fileNamePrefix}-${passportId}${PNG_EXTENSION}`;
}

/**
 * Renders an element to a PNG blob at export scale. On narrow phones the card is
 * scaled down with a CSS transform; the clone drops it so the PNG is always 1080 × 1920.
 * @param {HTMLElement} element
 * @returns {Promise<Blob>}
 */
export async function renderToPng(element) {
  if (!isExportAvailable()) throw new Error('Modul export belum termuat. Periksa koneksi internet.');
  const background = getComputedStyle(element).backgroundColor;
  const canvas = await globalThis.html2canvas(element, {
    scale: APP_CONFIG.passport.exportScale,
    width: element.offsetWidth,
    height: element.offsetHeight,
    backgroundColor: background,
    useCORS: true,
    logging: false,
    onclone: (_clonedDocument, clonedElement) => {
      clonedElement.style.transform = 'none';
    },
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat PNG.'))), PNG_TYPE);
  });
}

/**
 * Triggers a browser download for a blob.
 * @param {Blob} blob
 * @param {string} fileName
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Shares the PNG through the Web Share API when the device supports files,
 * otherwise downloads it.
 * @param {Blob} blob
 * @param {string} fileName
 * @param {string} shareText
 * @returns {Promise<'shared'|'downloaded'>}
 */
export async function shareOrDownload(blob, fileName, shareText) {
  const file = new File([blob], fileName, { type: PNG_TYPE });
  const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  if (!canShareFile) {
    downloadBlob(blob, fileName);
    return 'downloaded';
  }
  await navigator.share({ files: [file], text: shareText });
  return 'shared';
}
