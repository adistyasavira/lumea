/**
 * LUMÉA — QR code for the passport link, rendered as SVG with the
 * qrcode-generator library (loaded from cdnjs in index.html).
 */
import { APP_CONFIG } from '../config/app-config.js';

/**
 * Whether the QR library has loaded.
 * @returns {boolean}
 */
export function isQrAvailable() {
  return typeof globalThis.qrcode === 'function';
}

/**
 * Builds an SVG string for a QR code.
 * @param {string} text
 * @returns {string|null} null when the library is missing
 */
export function createQrSvgMarkup(text) {
  if (!isQrAvailable()) return null;
  const { typeNumber, errorCorrection, cellSize, margin } = APP_CONFIG.qr;
  const code = globalThis.qrcode(typeNumber, errorCorrection);
  code.addData(text);
  code.make();
  return code.createSvgTag({ cellSize, margin, scalable: true });
}

/**
 * Parses SVG markup produced by the library into an element (no innerHTML on the page).
 * @param {string} markup
 * @returns {SVGSVGElement|null}
 */
export function parseSvg(markup) {
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = parsed.documentElement;
  return svg && svg.nodeName.toLowerCase() === 'svg' ? document.importNode(svg, true) : null;
}

/**
 * Creates a QR code element for a link.
 * @param {string} text
 * @param {string} accessibleLabel
 * @returns {SVGSVGElement|null}
 */
export function createQrElement(text, accessibleLabel) {
  const markup = createQrSvgMarkup(text);
  const svg = markup ? parseSvg(markup) : null;
  if (!svg) return null;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', accessibleLabel);
  return svg;
}
