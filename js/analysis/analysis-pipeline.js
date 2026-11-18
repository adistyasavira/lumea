/**
 * LUMÉA — Orchestrates one frame: geometry → white balance → zone sampling →
 * quality checks (live) and, on demand, features → season (analysis).
 */
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { linearRgbToLab } from '../color/color-convert.js';
import { computeWhiteBalanceGains, NEUTRAL_GAINS } from '../color/white-balance.js';
import { computeGuideOval, computeZoneRects, computeReferenceRect, computeOvalBounds } from './zone-geometry.js';
import { createLabConverter, collectZoneSamples, readMeanLinearRgb } from './pixel-sampler.js';
import { validateCapture, computeSharpness } from './capture-validator.js';
import { measureSkin, measureDarkFeature, computeFeatures, describeFeatures, previewFeatureColors } from './feature-extractor.js';
import { classifySeason } from './season-classifier.js';
import { SEASONS } from '../data/seasons.js';

/**
 * @typedef {{offsets?:Record<string,{dx:number,dy:number}>, useReference?:boolean, hasMakeup?:boolean}} FrameOptions
 */

/**
 * Reads the grey reference card, if the operator says one is in frame.
 * @param {ImageData} imageData
 * @param {boolean} useReference
 * @returns {{linear:{r:number,g:number,b:number}, lab:{l:number,a:number,b:number}}|null}
 */
function readReference(imageData, useReference) {
  if (!useReference) return null;
  const linear = readMeanLinearRgb(imageData, computeReferenceRect(imageData));
  return linear ? { linear, lab: linearRgbToLab(linear) } : null;
}

/**
 * Samples a frame and rates its quality. Fast enough for the live preview loop.
 * @param {ImageData} imageData
 * @param {FrameOptions} [options]
 * @returns {{oval:object, rects:object, zones:object, quality:object, preview:object}}
 */
export function inspectFrame(imageData, options = {}) {
  const oval = computeGuideOval(imageData);
  const rects = computeZoneRects(oval, options.offsets ?? {}, imageData);
  const reference = readReference(imageData, Boolean(options.useReference));
  const gains = reference ? computeWhiteBalanceGains(reference.linear, ENGINE_CONFIG.numeric.epsilon) : NEUTRAL_GAINS;
  const zones = collectZoneSamples(imageData, rects, createLabConverter(gains));
  const sharpness = computeSharpness(imageData, computeOvalBounds(oval, imageData));
  const quality = validateCapture({ zones, referenceLab: reference ? reference.lab : null, sharpness });
  return { oval, rects, zones, quality, preview: previewFeatureColors(zones) };
}

/**
 * Full analysis of a captured still.
 * @param {ImageData} imageData
 * @param {FrameOptions} [options]
 * @returns {{features:object, labels:object, classification:object, skinLab:object, darkLab:object, quality:object, oval:object}}
 * @throws {import('./feature-extractor.js').AnalysisError}
 */
export function analyzeFrame(imageData, options = {}) {
  const inspection = inspectFrame(imageData, options);
  const hasMakeup = Boolean(options.hasMakeup);
  const skinLab = measureSkin(inspection.zones, hasMakeup);
  const darkLab = measureDarkFeature(inspection.zones, skinLab);
  const features = computeFeatures(skinLab, darkLab);
  const conditions = { forcedCapture: !inspection.quality.isReady, hasMakeup };
  return {
    features,
    labels: describeFeatures(features),
    classification: classifySeason(features, SEASONS, conditions),
    skinLab,
    darkLab,
    quality: inspection.quality,
    oval: inspection.oval,
  };
}
