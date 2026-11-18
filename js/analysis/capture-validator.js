/**
 * LUMÉA — Live lighting and framing checks shown to the operator before capture.
 * Each check returns good / warn / bad plus a one-line instruction.
 */
import { CAPTURE_CONFIG } from '../config/capture-config.js';
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { meanLab, trimmedMeanLab } from '../color/color-stats.js';

export const CHECK_STATUS = Object.freeze({ good: 'good', warn: 'warn', bad: 'bad' });

const { quality: THRESHOLDS, luma } = CAPTURE_CONFIG;
const CHANNELS_PER_PIXEL = 4;
const GREEN_OFFSET = 1;
const BLUE_OFFSET = 2;
const LAPLACIAN_CENTER_WEIGHT = 4;

/** Operator copy per check and status (Indonesian UI). */
const CHECK_COPY = Object.freeze({
  exposure: { label: 'Cahaya', good: 'Terang pas', warn: 'Sedikit terlalu gelap/terang', bad: 'Atur kecerahan ring light' },
  clipping: { label: 'Kilap', good: 'Tidak ada kilap', warn: 'Ada sedikit kilap di kulit', bad: 'Dahi/pipi mengkilap: turunkan ring light' },
  evenness: { label: 'Kerataan', good: 'Cahaya merata', warn: 'Satu sisi agak gelap', bad: 'Bayangan di satu pipi: ring light ke tengah' },
  whiteBalance: { label: 'White balance', good: 'Netral', warn: 'Tanpa kartu abu-abu / sedikit bergeser', bad: 'Warna bergeser: cek suhu ring light' },
  sharpness: { label: 'Ketajaman', good: 'Tajam', warn: 'Sedikit buram', bad: 'Buram: minta customer diam' },
  position: { label: 'Posisi wajah', good: 'Wajah di dalam oval', warn: 'Rapikan posisi wajah', bad: 'Wajah belum masuk oval' },
});

/** Rating where the value should sit inside a range. */
function rateRange(value, band) {
  if (value >= band.greenMin && value <= band.greenMax) return CHECK_STATUS.good;
  if (value >= band.yellowMin && value <= band.yellowMax) return CHECK_STATUS.warn;
  return CHECK_STATUS.bad;
}

/** Rating where lower is better. */
function rateAtMost(value, green, yellow) {
  if (value <= green) return CHECK_STATUS.good;
  return value <= yellow ? CHECK_STATUS.warn : CHECK_STATUS.bad;
}

/** Rating where higher is better. */
function rateAtLeast(value, green, yellow) {
  if (value >= green) return CHECK_STATUS.good;
  return value >= yellow ? CHECK_STATUS.warn : CHECK_STATUS.bad;
}

/** Builds a check result with its copy. */
function buildCheck(id, status, value) {
  return { id, status, value, label: CHECK_COPY[id].label, message: CHECK_COPY[id][status] };
}

/** Skin zones only. */
const skinZonesOf = (zones) => Object.values(zones).filter((zone) => zone.kind === 'skin');

/** Average L* of every pixel in the skin zones (skin-masked or not). */
function checkExposure(zones) {
  const lab = meanLab(skinZonesOf(zones).flatMap((zone) => zone.all));
  const lightness = lab ? lab.l : 0;
  return buildCheck('exposure', rateRange(lightness, THRESHOLDS.exposure), lightness);
}

/** Share of clipped pixels in the skin zones. */
function checkClipping(zones) {
  const skinZones = skinZonesOf(zones);
  const total = skinZones.reduce((sum, zone) => sum + zone.all.length, 0);
  const clipped = skinZones.reduce((sum, zone) => sum + zone.clippedCount, 0);
  const ratio = total === 0 ? 1 : clipped / total;
  return buildCheck('clipping', rateAtMost(ratio, THRESHOLDS.clipping.green, THRESHOLDS.clipping.yellow), ratio);
}

/** L* difference between the two cheeks. */
function checkEvenness(zones) {
  const left = trimmedMeanLab(zones.cheekLeft.all, ENGINE_CONFIG.trimming);
  const right = trimmedMeanLab(zones.cheekRight.all, ENGINE_CONFIG.trimming);
  const gap = left && right ? Math.abs(left.l - right.l) : Number.POSITIVE_INFINITY;
  return buildCheck('evenness', rateAtMost(gap, THRESHOLDS.evenness.green, THRESHOLDS.evenness.yellow), gap);
}

/** Neutrality of the grey card; without a card the check is a warning, never a block. */
function checkWhiteBalance(referenceLab) {
  if (!referenceLab) return buildCheck('whiteBalance', CHECK_STATUS.warn, null);
  const drift = Math.max(Math.abs(referenceLab.a), Math.abs(referenceLab.b));
  const status = rateAtMost(drift, THRESHOLDS.whiteBalance.green, THRESHOLDS.whiteBalance.yellow);
  return buildCheck('whiteBalance', status, drift);
}

/** Sharpness from the Laplacian variance. */
function checkSharpness(variance) {
  const band = THRESHOLDS.sharpness;
  const status = rateAtLeast(variance, band.calibratedVariance, band.calibratedVariance * band.yellowRatio);
  return buildCheck('sharpness', status, variance);
}

/** Share of skin pixels in forehead and cheeks: is a face inside the oval? */
function checkPosition(zones) {
  const skinZones = skinZonesOf(zones);
  const total = skinZones.reduce((sum, zone) => sum + zone.all.length, 0);
  const skin = skinZones.reduce((sum, zone) => sum + zone.skin.length, 0);
  const ratio = total === 0 ? 0 : skin / total;
  return buildCheck('position', rateAtLeast(ratio, THRESHOLDS.position.green, THRESHOLDS.position.yellow), ratio);
}

/** Luma of the pixel at a flat RGBA index. */
function lumaAt(data, index) {
  return luma.red * data[index] + luma.green * data[index + GREEN_OFFSET] + luma.blue * data[index + BLUE_OFFSET];
}

/** Laplacian response at (column, row). */
function laplacianAt(imageData, column, row) {
  const { data, width } = imageData;
  const index = (row * width + column) * CHANNELS_PER_PIXEL;
  const rowStride = width * CHANNELS_PER_PIXEL;
  const neighbours = lumaAt(data, index - CHANNELS_PER_PIXEL) + lumaAt(data, index + CHANNELS_PER_PIXEL)
    + lumaAt(data, index - rowStride) + lumaAt(data, index + rowStride);
  return neighbours - LAPLACIAN_CENTER_WEIGHT * lumaAt(data, index);
}

/**
 * Variance of the Laplacian inside a rectangle (higher = sharper).
 * @param {ImageData} imageData
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @returns {number}
 */
export function computeSharpness(imageData, rect) {
  const stride = THRESHOLDS.sharpness.pixelStride;
  let sum = 0;
  let sumOfSquares = 0;
  let count = 0;
  for (let row = Math.max(rect.y, 1); row < Math.min(rect.y + rect.h, imageData.height - 1); row += stride) {
    for (let column = Math.max(rect.x, 1); column < Math.min(rect.x + rect.w, imageData.width - 1); column += stride) {
      const response = laplacianAt(imageData, column, row);
      sum += response;
      sumOfSquares += response * response;
      count += 1;
    }
  }
  return count === 0 ? 0 : sumOfSquares / count - (sum / count) ** 2;
}

/**
 * Runs every check.
 * @param {{zones:Record<string,object>, referenceLab:{a:number,b:number}|null, sharpness:number}} measurements
 * @returns {{checks:Array, isReady:boolean, hasBlocker:boolean}}
 */
export function validateCapture(measurements) {
  const checks = [
    checkExposure(measurements.zones),
    checkClipping(measurements.zones),
    checkEvenness(measurements.zones),
    checkWhiteBalance(measurements.referenceLab),
    checkSharpness(measurements.sharpness),
    checkPosition(measurements.zones),
  ];
  const isBlocking = (check) => check.status === CHECK_STATUS.bad;
  const isIdeal = (check) => check.status === CHECK_STATUS.good || (check.id === 'whiteBalance' && measurements.referenceLab === null);
  return { checks, isReady: checks.every(isIdeal), hasBlocker: checks.some(isBlocking) };
}
