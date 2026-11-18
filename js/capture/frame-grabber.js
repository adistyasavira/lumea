/**
 * LUMÉA — Draws a video or image source into a downscaled working canvas and
 * returns its pixels. Live video is mirrored so the frame matches what the
 * customer sees on screen.
 */
import { CAPTURE_CONFIG } from '../config/capture-config.js';

/**
 * Natural size of a drawable source.
 * @param {HTMLVideoElement|ImageBitmap|HTMLImageElement} source
 * @returns {{width:number, height:number}}
 */
export function getSourceSize(source) {
  if ('videoWidth' in source) return { width: source.videoWidth, height: source.videoHeight };
  if ('naturalWidth' in source) return { width: source.naturalWidth, height: source.naturalHeight };
  return { width: source.width, height: source.height };
}

/**
 * Processing size: the configured width, aspect ratio preserved, never upscaled.
 * @param {{width:number, height:number}} sourceSize
 * @returns {{width:number, height:number}}
 */
export function computeProcessingSize(sourceSize) {
  const scale = Math.min(1, CAPTURE_CONFIG.processing.frameWidth / sourceSize.width);
  return { width: Math.round(sourceSize.width * scale), height: Math.round(sourceSize.height * scale) };
}

/**
 * Creates a reusable working canvas (never attached to the page).
 * @returns {{canvas: HTMLCanvasElement, context: CanvasRenderingContext2D}}
 */
export function createWorkingCanvas() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return { canvas, context };
}

/**
 * Draws the source into the working canvas and returns its pixels.
 * @param {HTMLVideoElement|ImageBitmap|HTMLImageElement} source
 * @param {{canvas: HTMLCanvasElement, context: CanvasRenderingContext2D}} working
 * @param {{mirror: boolean}} options
 * @returns {ImageData|null} null while the video has no frame yet
 */
export function grabFrame(source, working, options) {
  const sourceSize = getSourceSize(source);
  if (sourceSize.width === 0 || sourceSize.height === 0) return null;
  const size = computeProcessingSize(sourceSize);
  const { canvas, context } = working;
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  context.save();
  if (options.mirror) {
    context.translate(size.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, 0, 0, size.width, size.height);
  context.restore();
  return context.getImageData(0, 0, size.width, size.height);
}

/**
 * Paints captured pixels onto a visible canvas.
 * @param {HTMLCanvasElement} targetCanvas
 * @param {ImageData} imageData
 */
export function paintStill(targetCanvas, imageData) {
  targetCanvas.width = imageData.width;
  targetCanvas.height = imageData.height;
  targetCanvas.getContext('2d').putImageData(imageData, 0, 0);
}
