/**
 * LUMÉA — 12-season classifier. Each season is a prototype on four normalised axes;
 * the customer is matched by weighted Euclidean distance, and confidence comes from
 * how clearly the closest season beats the runner-up.
 */
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { toSignedUnit, clamp } from '../color/color-stats.js';

const { axisWeights, featureScales, confidence: CONFIDENCE, numeric } = ENGINE_CONFIG;
const AXES = Object.freeze(Object.keys(axisWeights));

/**
 * Maps raw features onto the −1…+1 axes.
 * @param {{lightness:number, undertone:number, chroma:number, contrast:number}} features
 * @returns {{lightness:number, undertone:number, chroma:number, contrast:number}}
 */
export function normalizeFeatures(features) {
  return Object.fromEntries(AXES.map((axis) => [axis, toSignedUnit(features[axis], featureScales[axis])]));
}

/**
 * Weighted Euclidean distance between two axis vectors.
 * @param {Record<string, number>} vectorA
 * @param {Record<string, number>} vectorB
 * @returns {number}
 */
export function weightedDistance(vectorA, vectorB) {
  const sum = AXES.reduce((total, axis) => total + axisWeights[axis] * (vectorA[axis] - vectorB[axis]) ** 2, 0);
  return Math.sqrt(sum);
}

/**
 * All seasons sorted from closest to farthest.
 * @param {Record<string, number>} vector normalised customer vector
 * @param {ReadonlyArray<{id:string, prototype:Record<string, number>}>} seasons
 * @returns {Array<{season:object, distance:number}>}
 */
export function rankSeasons(vector, seasons) {
  return seasons
    .map((season) => ({ season, distance: weightedDistance(vector, season.prototype) }))
    .sort((first, second) => first.distance - second.distance);
}

/**
 * Confidence from the two closest distances, reduced for non-ideal captures.
 * @param {number} closest distance to the best season
 * @param {number} runnerUp distance to the second season
 * @param {{forcedCapture:boolean, hasMakeup:boolean}} conditions
 * @returns {{percent:number, isAmbiguous:boolean}}
 */
export function computeConfidence(closest, runnerUp, conditions) {
  const relativeMargin = (runnerUp - closest) / Math.max(runnerUp, numeric.epsilon);
  const share = 1 - closest / Math.max(closest + runnerUp, numeric.epsilon);
  const forcedFactor = conditions.forcedCapture ? CONFIDENCE.forcedCapturePenalty : 1;
  const makeupFactor = conditions.hasMakeup ? CONFIDENCE.makeupPenalty : 1;
  const percent = Math.round(share * numeric.percent * forcedFactor * makeupFactor);
  return {
    percent: clamp(percent, CONFIDENCE.minimumPercent, CONFIDENCE.maximumPercent),
    isAmbiguous: relativeMargin < CONFIDENCE.ambiguousMargin,
  };
}

/**
 * Classifies measured features into a primary and secondary season.
 * @param {{lightness:number, undertone:number, chroma:number, contrast:number}} features
 * @param {ReadonlyArray<{id:string, prototype:Record<string, number>}>} seasons
 * @param {{forcedCapture:boolean, hasMakeup:boolean}} conditions
 * @returns {{primary:object, secondary:object, confidence:{percent:number,isAmbiguous:boolean}, vector:object}}
 */
export function classifySeason(features, seasons, conditions) {
  const vector = normalizeFeatures(features);
  const [first, second] = rankSeasons(vector, seasons);
  return {
    primary: first.season,
    secondary: second.season,
    confidence: computeConfidence(first.distance, second.distance, conditions),
    vector,
  };
}
