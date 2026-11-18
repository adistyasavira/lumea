/**
 * LUMÉA — "Does this colour suit me?" Compares any colour with the customer's
 * palette and avoid list using CIEDE2000 (perceptual), not RGB distance.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { hexToLab } from '../color/color-convert.js';
import { deltaE2000 } from '../color/delta-e.js';

export const CHECK_VERDICTS = Object.freeze({ match: 'match', near: 'near', avoid: 'avoid', neutral: 'neutral' });

/**
 * Closest swatch to a colour.
 * @param {{l:number,a:number,b:number}} lab
 * @param {ReadonlyArray<{name:string, hex:string}>} swatches
 * @returns {{swatch:{name:string, hex:string}, deltaE:number}}
 */
function findNearest(lab, swatches) {
  return swatches
    .map((swatch) => ({ swatch, deltaE: deltaE2000(lab, hexToLab(swatch.hex)) }))
    .reduce((best, candidate) => (candidate.deltaE < best.deltaE ? candidate : best));
}

/**
 * Judges a colour against a season.
 * @param {string} hex
 * @param {{palette:ReadonlyArray<object>, avoid:ReadonlyArray<object>}} season
 * @returns {{verdict:string, nearest:{swatch:object, deltaE:number}}|null} null for an invalid hex
 */
export function checkColor(hex, season) {
  const lab = hexToLab(hex);
  if (!lab) return null;
  const { matchDeltaE, nearDeltaE } = APP_CONFIG.checker;
  const nearestBest = findNearest(lab, season.palette);
  const nearestAvoid = findNearest(lab, season.avoid);
  if (nearestBest.deltaE <= matchDeltaE) return { verdict: CHECK_VERDICTS.match, nearest: nearestBest };
  if (nearestAvoid.deltaE < nearestBest.deltaE) return { verdict: CHECK_VERDICTS.avoid, nearest: nearestBest };
  if (nearestBest.deltaE <= nearDeltaE) return { verdict: CHECK_VERDICTS.near, nearest: nearestBest };
  return { verdict: CHECK_VERDICTS.neutral, nearest: nearestBest };
}
