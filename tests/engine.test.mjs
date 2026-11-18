/**
 * LUMEA — Engine self-test. Run with: node tests/engine.test.mjs
 * Uses synthetic frames (no camera, no DOM) to check conversions, trimming,
 * feature extraction and classification end to end.
 */
import assert from 'node:assert/strict';
import { rgbToLab, labToHex, hexToRgb } from '../js/color/color-convert.js';
import { trimmedMeanLab } from '../js/color/color-stats.js';
import { deltaE2000 } from '../js/color/delta-e.js';
import { analyzeFrame, inspectFrame } from '../js/analysis/analysis-pipeline.js';
import { computeGuideOval, computeZoneRects } from '../js/analysis/zone-geometry.js';

const FRAME = { width: 720, height: 405 };
const BACKDROP = { r: 200, g: 200, b: 200 };

/** Minimal ImageData stand-in for Node. */
function createFrame(fill) {
  const data = new Uint8ClampedArray(FRAME.width * FRAME.height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data.set([fill.r, fill.g, fill.b, 255], index);
  }
  return { width: FRAME.width, height: FRAME.height, data };
}

function paintRect(frame, rect, color, noise = 0, seed = 1) {
  let state = seed;
  const random = () => { state = (state * 16807) % 2147483647; return state / 2147483647 - 0.5; };
  for (let row = rect.y; row < rect.y + rect.h; row += 1) {
    for (let column = rect.x; column < rect.x + rect.w; column += 1) {
      const index = (row * frame.width + column) * 4;
      const jitter = Math.round(random() * noise);
      frame.data.set([color.r + jitter, color.g + jitter, color.b + jitter, 255], index);
    }
  }
}

/** Synthetic face: skin over the oval box, dark brows and hair. */
function syntheticFace(skin, brow, hair) {
  const frame = createFrame(BACKDROP);
  const oval = computeGuideOval(frame);
  const box = { x: Math.round(oval.cx - oval.width / 2), y: Math.round(oval.cy - oval.height / 2), w: Math.round(oval.width), h: Math.round(oval.height) };
  paintRect(frame, box, skin, 10);
  const rects = computeZoneRects(oval, {}, frame);
  paintRect(frame, rects.browLeft, brow, 4, 7);
  paintRect(frame, rects.browRight, brow, 4, 9);
  paintRect(frame, rects.hair, hair, 4, 11);
  return frame;
}

// 1. Conversions: sRGB white → L* 100, a*,b* ≈ 0; round trip.
const white = rgbToLab({ r: 255, g: 255, b: 255 });
assert.ok(Math.abs(white.l - 100) < 0.01 && Math.abs(white.a) < 0.01 && Math.abs(white.b) < 0.01, 'white point');
assert.equal(labToHex(rgbToLab(hexToRgb('#C85A32'))), '#C85A32', 'round trip');

// 2. CIEDE2000 reference pair (Sharma et al., pair 1): ΔE = 2.0425.
const pairDelta = deltaE2000({ l: 50, a: 2.6772, b: -79.7751 }, { l: 50, a: 0, b: -82.7485 });
assert.ok(Math.abs(pairDelta - 2.0425) < 0.0001, `ciede2000 ${pairDelta}`);

// 3. Trimmed mean ignores glare and shadow outliers.
const samples = [...Array(70).fill({ l: 60, a: 12, b: 18 }), ...Array(15).fill({ l: 98, a: 0, b: 0 }), ...Array(15).fill({ l: 10, a: 0, b: 0 })];
assert.ok(Math.abs(trimmedMeanLab(samples, { lowerRatio: 0.15, upperRatio: 0.15 }).l - 60) < 0.001, 'trimmed mean');

// 4. End to end on synthetic faces.
const cases = [
  { name: 'kulit sawo matang, rambut hitam', skin: { r: 198, g: 150, b: 120 } },
  { name: 'kulit cerah kekuningan, rambut hitam', skin: { r: 235, g: 200, b: 170 } },
  { name: 'kulit cerah kemerahan, rambut hitam', skin: { r: 232, g: 190, b: 182 } },
  { name: 'kulit gelap hangat, rambut hitam', skin: { r: 150, g: 100, b: 70 } },
];
const black = { r: 28, g: 24, b: 24 };
for (const testCase of cases) {
  const frame = syntheticFace(testCase.skin, black, black);
  const result = analyzeFrame(frame, {});
  const { features, classification } = result;
  console.log(
    `${testCase.name.padEnd(38)} ITA ${features.lightness.toFixed(1).padStart(6)}  h ${features.undertone.toFixed(1)}  `
    + `C ${features.chroma.toFixed(1)}  ΔL ${features.contrast.toFixed(1)}  → ${classification.primary.name} `
    + `(${classification.confidence.percent}%, kedua ${classification.secondary.name})`,
  );
}
const seasonsSeen = new Set(cases.map((testCase) => analyzeFrame(syntheticFace(testCase.skin, black, black)).classification.primary.id));
assert.ok(seasonsSeen.size >= 3, 'different skins must not collapse into one season');

// 5. Live inspection reports six checks; an empty frame is not ready.
const emptyInspection = inspectFrame(createFrame(BACKDROP));
assert.equal(emptyInspection.quality.checks.length, 6);
assert.equal(emptyInspection.quality.isReady, false);

console.log('Semua tes engine lulus.');
