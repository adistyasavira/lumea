/**
 * LUMÉA — Face guide geometry: the alignment oval and the pixel rectangles of every
 * sampling zone, including the operator's manual calibration offsets.
 */
import { CAPTURE_CONFIG } from '../config/capture-config.js';

/**
 * @typedef {{x:number,y:number,w:number,h:number}} PixelRect
 * @typedef {{cx:number,cy:number,width:number,height:number}} Oval
 * @typedef {{width:number,height:number}} FrameSize
 */

/**
 * Computes the guide oval for a frame.
 * @param {FrameSize} frame
 * @returns {Oval}
 */
export function computeGuideOval(frame) {
  const guide = CAPTURE_CONFIG.guideOval;
  const height = frame.height * guide.heightRatio;
  return {
    cx: frame.width * guide.centerXRatio,
    cy: frame.height * guide.centerYRatio,
    width: height * guide.aspectRatio,
    height,
  };
}

/**
 * Clamps a rectangle to the frame and rounds it to whole pixels.
 * @param {PixelRect} rect
 * @param {FrameSize} frame
 * @returns {PixelRect}
 */
function clampRect(rect, frame) {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const right = Math.min(frame.width, Math.round(rect.x + rect.w));
  const bottom = Math.min(frame.height, Math.round(rect.y + rect.h));
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

/**
 * Pixel rectangle of one zone, shifted by the operator's offset.
 * @param {Oval} oval
 * @param {{x:number,y:number,w:number,h:number}} zone ratios from CAPTURE_CONFIG.zones
 * @param {{dx:number,dy:number}} offset in frame pixels
 * @param {FrameSize} frame
 * @returns {PixelRect}
 */
export function computeZoneRect(oval, zone, offset, frame) {
  const width = zone.w * oval.width;
  const height = zone.h * oval.height;
  const centerX = oval.cx + zone.x * oval.width + offset.dx;
  const centerY = oval.cy + zone.y * oval.height + offset.dy;
  return clampRect({ x: centerX - width / 2, y: centerY - height / 2, w: width, h: height }, frame);
}

/**
 * Pixel rectangles of all zones.
 * @param {Oval} oval
 * @param {Record<string,{dx:number,dy:number}>} offsets keyed by zone id
 * @param {FrameSize} frame
 * @returns {Record<string, PixelRect>}
 */
export function computeZoneRects(oval, offsets, frame) {
  const noOffset = { dx: 0, dy: 0 };
  return Object.fromEntries(
    Object.entries(CAPTURE_CONFIG.zones).map(([zoneId, zone]) => [
      zoneId,
      computeZoneRect(oval, zone, offsets[zoneId] ?? noOffset, frame),
    ]),
  );
}

/**
 * Pixel rectangle of the optional grey reference card.
 * @param {FrameSize} frame
 * @returns {PixelRect}
 */
export function computeReferenceRect(frame) {
  const patch = CAPTURE_CONFIG.referencePatch;
  const size = frame.width * patch.sizeRatio;
  return clampRect({ x: frame.width * patch.xRatio, y: frame.height * patch.yRatio, w: size, h: size }, frame);
}

/**
 * Bounding rectangle of the oval (used for sharpness and drape cropping).
 * @param {Oval} oval
 * @param {FrameSize} frame
 * @param {number} [paddingRatio=0] extra margin as a fraction of the oval size
 * @returns {PixelRect}
 */
export function computeOvalBounds(oval, frame, paddingRatio = 0) {
  const width = oval.width * (1 + paddingRatio);
  const height = oval.height * (1 + paddingRatio);
  return clampRect({ x: oval.cx - width / 2, y: oval.cy - height / 2, w: width, h: height }, frame);
}
