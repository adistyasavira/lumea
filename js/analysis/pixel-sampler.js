/**
 * LUMÉA — Reads pixels from sampling zones and converts them to CIELAB.
 */
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { CAPTURE_CONFIG } from '../config/capture-config.js';
import { SRGB_TO_LINEAR_TABLE, linearRgbToLab, labToLch } from '../color/color-convert.js';
import { applyWhiteBalance } from '../color/white-balance.js';

const CHANNELS_PER_PIXEL = 4;
const GREEN_OFFSET = 1;
const BLUE_OFFSET = 2;

/**
 * Creates a converter from 8-bit sRGB to white-balanced CIELAB.
 * @param {{r:number,g:number,b:number}} gains white balance gains
 * @returns {(r:number, g:number, b:number) => {l:number,a:number,b:number}}
 */
export function createLabConverter(gains) {
  return (red, green, blue) => linearRgbToLab(applyWhiteBalance(
    { r: SRGB_TO_LINEAR_TABLE[red], g: SRGB_TO_LINEAR_TABLE[green], b: SRGB_TO_LINEAR_TABLE[blue] },
    gains,
  ));
}

/**
 * Calls `visit(red, green, blue)` for every pixel inside a rectangle.
 * @param {ImageData} imageData
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @param {(red:number, green:number, blue:number) => void} visit
 */
export function forEachPixel(imageData, rect, visit) {
  const { data, width } = imageData;
  for (let row = rect.y; row < rect.y + rect.h; row += 1) {
    for (let column = rect.x; column < rect.x + rect.w; column += 1) {
      const index = (row * width + column) * CHANNELS_PER_PIXEL;
      visit(data[index], data[index + GREEN_OFFSET], data[index + BLUE_OFFSET]);
    }
  }
}

/**
 * Mean linear RGB inside a rectangle (used for the grey reference card).
 * @param {ImageData} imageData
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @returns {{r:number,g:number,b:number}|null}
 */
export function readMeanLinearRgb(imageData, rect) {
  const sum = { r: 0, g: 0, b: 0 };
  let count = 0;
  forEachPixel(imageData, rect, (red, green, blue) => {
    sum.r += SRGB_TO_LINEAR_TABLE[red];
    sum.g += SRGB_TO_LINEAR_TABLE[green];
    sum.b += SRGB_TO_LINEAR_TABLE[blue];
    count += 1;
  });
  return count === 0 ? null : { r: sum.r / count, g: sum.g / count, b: sum.b / count };
}

/**
 * Whether a CIELAB pixel looks like skin.
 * @param {{l:number,a:number,b:number}} lab
 * @returns {boolean}
 */
export function isSkinLab(lab) {
  const mask = ENGINE_CONFIG.skinMask;
  const { c, h } = labToLch(lab);
  return lab.l >= mask.lightnessMin && lab.l <= mask.lightnessMax
    && c >= mask.chromaMin && c <= mask.chromaMax
    && h >= mask.hueMinDegrees && h <= mask.hueMaxDegrees;
}

/**
 * Samples one rectangle: every pixel as Lab, the skin subset and the clipped count.
 * @param {ImageData} imageData
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @param {(r:number,g:number,b:number)=>{l:number,a:number,b:number}} toLab
 * @returns {{all:Array, skin:Array, clippedCount:number}}
 */
export function sampleRect(imageData, rect, toLab) {
  const limit = CAPTURE_CONFIG.quality.clipping.channelLimit;
  const result = { all: [], skin: [], clippedCount: 0 };
  forEachPixel(imageData, rect, (red, green, blue) => {
    if (red >= limit || green >= limit || blue >= limit) result.clippedCount += 1;
    const lab = toLab(red, green, blue);
    result.all.push(lab);
    if (isSkinLab(lab)) result.skin.push(lab);
  });
  return result;
}

/**
 * Samples every zone.
 * @param {ImageData} imageData
 * @param {Record<string,{x:number,y:number,w:number,h:number}>} rects
 * @param {(r:number,g:number,b:number)=>{l:number,a:number,b:number}} toLab
 * @returns {Record<string,{kind:string, all:Array, skin:Array, clippedCount:number}>}
 */
export function collectZoneSamples(imageData, rects, toLab) {
  return Object.fromEntries(
    Object.entries(rects).map(([zoneId, rect]) => [
      zoneId,
      { kind: CAPTURE_CONFIG.zones[zoneId].kind, ...sampleRect(imageData, rect, toLab) },
    ]),
  );
}
