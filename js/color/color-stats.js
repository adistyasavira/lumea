/**
 * LUMÉA — Robust statistics over CIELAB samples.
 * Pure functions, no DOM access.
 */

/**
 * Arithmetic mean of Lab samples.
 * @param {ReadonlyArray<{l:number,a:number,b:number}>} samples
 * @returns {{l:number,a:number,b:number}|null} null when there are no samples
 */
export function meanLab(samples) {
  if (samples.length === 0) return null;
  const total = samples.reduce(
    (sum, sample) => ({ l: sum.l + sample.l, a: sum.a + sample.a, b: sum.b + sample.b }),
    { l: 0, a: 0, b: 0 },
  );
  return { l: total.l / samples.length, a: total.a / samples.length, b: total.b / samples.length };
}

/**
 * Sorts samples by lightness, ascending, without mutating the input.
 * @param {ReadonlyArray<{l:number}>} samples
 * @returns {Array}
 */
function sortByLightness(samples) {
  return [...samples].sort((first, second) => first.l - second.l);
}

/**
 * Trimmed mean ranked by L*: discards the darkest `lowerRatio` and the brightest
 * `upperRatio` of samples, then averages L*, a* and b* of what remains.
 * @param {ReadonlyArray<{l:number,a:number,b:number}>} samples
 * @param {{lowerRatio:number, upperRatio:number}} trimming
 * @returns {{l:number,a:number,b:number}|null}
 */
export function trimmedMeanLab(samples, trimming) {
  const sorted = sortByLightness(samples);
  const dropLow = Math.floor(sorted.length * trimming.lowerRatio);
  const dropHigh = Math.floor(sorted.length * trimming.upperRatio);
  const kept = sorted.slice(dropLow, sorted.length - dropHigh);
  return meanLab(kept.length > 0 ? kept : sorted);
}

/**
 * Keeps only the darkest share of samples (e.g. eyebrow hairs inside a box that also holds skin).
 * @param {ReadonlyArray<{l:number}>} samples
 * @param {number} ratio between 0 and 1
 * @returns {Array}
 */
export function takeDarkest(samples, ratio) {
  const keepCount = Math.max(1, Math.ceil(samples.length * ratio));
  return sortByLightness(samples).slice(0, keepCount);
}

/**
 * Weighted mean of Lab values. Entries with a null colour are skipped and the
 * remaining weights renormalised.
 * @param {ReadonlyArray<{lab:{l:number,a:number,b:number}|null, weight:number}>} entries
 * @returns {{l:number,a:number,b:number}|null}
 */
export function weightedMeanLab(entries) {
  const usable = entries.filter((entry) => entry.lab !== null && entry.weight > 0);
  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return null;
  return usable.reduce(
    (sum, entry) => {
      const share = entry.weight / totalWeight;
      return { l: sum.l + entry.lab.l * share, a: sum.a + entry.lab.a * share, b: sum.b + entry.lab.b * share };
    },
    { l: 0, a: 0, b: 0 },
  );
}

/**
 * Clamps a value into [minimum, maximum].
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Maps a value from [min, max] onto the −1…+1 axis, clamped.
 * @param {number} value
 * @param {{min:number, max:number}} scale
 * @returns {number}
 */
export function toSignedUnit(value, scale) {
  const unit = (value - scale.min) / (scale.max - scale.min);
  return clamp(unit * 2 - 1, -1, 1);
}
