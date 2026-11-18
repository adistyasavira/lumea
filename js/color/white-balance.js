/**
 * LUMÉA — White balance correction from a neutral reference patch (von Kries scaling
 * in linear RGB). If the grey card reads slightly blue or yellow, every pixel is
 * rescaled so the card becomes neutral again.
 */

/** Gains that leave colours untouched. */
export const NEUTRAL_GAINS = Object.freeze({ r: 1, g: 1, b: 1 });

/**
 * Computes per-channel gains that map the reference colour onto neutral grey of the
 * same average level.
 * @param {{r:number,g:number,b:number}|null} referenceLinear mean linear RGB of the grey card
 * @param {number} epsilon guard against division by zero
 * @returns {{r:number,g:number,b:number}}
 */
export function computeWhiteBalanceGains(referenceLinear, epsilon) {
  if (!referenceLinear) return NEUTRAL_GAINS;
  const level = (referenceLinear.r + referenceLinear.g + referenceLinear.b) / 3;
  if (level <= epsilon) return NEUTRAL_GAINS;
  return {
    r: level / Math.max(referenceLinear.r, epsilon),
    g: level / Math.max(referenceLinear.g, epsilon),
    b: level / Math.max(referenceLinear.b, epsilon),
  };
}

/**
 * Applies white balance gains to a linear RGB colour.
 * @param {{r:number,g:number,b:number}} linear
 * @param {{r:number,g:number,b:number}} gains
 * @returns {{r:number,g:number,b:number}}
 */
export function applyWhiteBalance(linear, gains) {
  return { r: linear.r * gains.r, g: linear.g * gains.g, b: linear.b * gains.b };
}
