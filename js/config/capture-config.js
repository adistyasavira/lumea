/**
 * LUMÉA — Capture configuration: camera, face guide geometry, sampling zones and
 * the live lighting/framing checks. Geometry is expressed as ratios so it works on
 * landscape laptops and portrait tablets alike.
 */

/** getUserMedia request. The booth camera faces the customer. */
const CAMERA = Object.freeze({
  facingMode: 'user',
  idealWidth: 1280,
  idealHeight: 720,
  /** Let auto-exposure and auto-white-balance settle before locking them (where supported). */
  settleMilliseconds: 2000,
});

/** Frames are downscaled to this width before analysis: enough detail, fast on tablets. */
const PROCESSING = Object.freeze({ frameWidth: 720 });

/** Face alignment oval, relative to the frame. Height drives size; width follows a face aspect. */
const GUIDE_OVAL = Object.freeze({
  centerXRatio: 0.5,
  centerYRatio: 0.5,
  heightRatio: 0.7,
  aspectRatio: 0.76,
  /** Eye line drawn inside the oval, as a fraction of oval height from its centre (negative = up). */
  eyeLineOffsetRatio: -0.06,
});

/**
 * Sampling zones relative to the oval centre: x/y offsets and w/h sizes are fractions
 * of the oval width (x, w) and height (y, h). Matches the Stage 2 zone table.
 */
const SAMPLING_ZONES = Object.freeze({
  forehead: Object.freeze({ x: 0, y: -0.3, w: 0.3, h: 0.1, kind: 'skin', label: 'Dahi' }),
  cheekLeft: Object.freeze({ x: -0.22, y: 0.1, w: 0.16, h: 0.12, kind: 'skin', label: 'Pipi kiri' }),
  cheekRight: Object.freeze({ x: 0.22, y: 0.1, w: 0.16, h: 0.12, kind: 'skin', label: 'Pipi kanan' }),
  browLeft: Object.freeze({ x: -0.18, y: -0.13, w: 0.14, h: 0.05, kind: 'brow', label: 'Alis kiri' }),
  browRight: Object.freeze({ x: 0.18, y: -0.13, w: 0.14, h: 0.05, kind: 'brow', label: 'Alis kanan' }),
  hair: Object.freeze({ x: 0, y: -0.56, w: 0.3, h: 0.06, kind: 'hair', label: 'Rambut' }),
});

/** Optional 18% grey card taped in the top-left corner, as fractions of the frame. */
const REFERENCE_PATCH = Object.freeze({ xRatio: 0.02, yRatio: 0.03, sizeRatio: 0.08 });

/** Live lighting and framing checks (calibrate). */
const QUALITY_THRESHOLDS = Object.freeze({
  exposure: Object.freeze({ greenMin: 50, greenMax: 78, yellowMin: 42, yellowMax: 85 }),
  clipping: Object.freeze({ channelLimit: 250, green: 0.02, yellow: 0.06 }),
  evenness: Object.freeze({ green: 4, yellow: 8 }),
  whiteBalance: Object.freeze({ green: 3, yellow: 6 }),
  sharpness: Object.freeze({ calibratedVariance: 80, yellowRatio: 0.6, pixelStride: 2 }),
  position: Object.freeze({ green: 0.7, yellow: 0.5 }),
});

/** Rec. 601 luma weights used for the sharpness (Laplacian) measure. */
const LUMA_WEIGHTS = Object.freeze({ red: 0.299, green: 0.587, blue: 0.114 });

/** Timing of the live loop and the capture countdown. */
const TIMING = Object.freeze({ liveCheckIntervalMilliseconds: 200, countdownSeconds: 3, countdownTickMilliseconds: 1000 });

export const CAPTURE_CONFIG = Object.freeze({
  camera: CAMERA,
  processing: PROCESSING,
  guideOval: GUIDE_OVAL,
  zones: SAMPLING_ZONES,
  referencePatch: REFERENCE_PATCH,
  quality: QUALITY_THRESHOLDS,
  luma: LUMA_WEIGHTS,
  timing: TIMING,
});
