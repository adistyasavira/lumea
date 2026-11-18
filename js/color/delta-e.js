/**
 * LUMÉA — CIEDE2000 colour difference (Sharma, Wu & Dalal, 2005).
 * Used by the colour checker to compare any colour with the customer's palette.
 */

const DEGREES_PER_RADIAN = 180 / Math.PI;
const RADIANS_PER_DEGREE = Math.PI / 180;
const FULL_TURN = 360;
const HALF_TURN = 180;

/** Formula constants from the CIEDE2000 definition. */
const CIEDE2000 = Object.freeze({
  chromaPower: 7,
  chromaReference: 25,
  lightnessMid: 50,
  lightnessWeight: 0.015,
  lightnessOffset: 20,
  chromaWeight: 0.045,
  hueWeight: 0.015,
  rotationPeakDegrees: 275,
  rotationWidthDegrees: 25,
  rotationScaleDegrees: 30,
  parametricFactor: 1,
  hueTerms: Object.freeze([
    Object.freeze({ weight: -0.17, multiple: 1, offset: -30 }),
    Object.freeze({ weight: 0.24, multiple: 2, offset: 0 }),
    Object.freeze({ weight: 0.32, multiple: 3, offset: 6 }),
    Object.freeze({ weight: -0.2, multiple: 4, offset: -63 }),
  ]),
});

const chromaCompensation = (meanChroma) => {
  const powered = meanChroma ** CIEDE2000.chromaPower;
  return Math.sqrt(powered / (powered + CIEDE2000.chromaReference ** CIEDE2000.chromaPower));
};

const hueDegrees = (b, aPrime) => {
  if (b === 0 && aPrime === 0) return 0;
  const angle = Math.atan2(b, aPrime) * DEGREES_PER_RADIAN;
  return angle >= 0 ? angle : angle + FULL_TURN;
};

/** Adjusted a′, C′ and h′ for both colours. */
function primeComponents(first, second) {
  const meanChroma = (Math.hypot(first.a, first.b) + Math.hypot(second.a, second.b)) / 2;
  const g = (1 - chromaCompensation(meanChroma)) / 2;
  const prime = (lab) => {
    const aPrime = lab.a * (1 + g);
    return { l: lab.l, c: Math.hypot(aPrime, lab.b), h: hueDegrees(lab.b, aPrime) };
  };
  return [prime(first), prime(second)];
}

/** Hue difference Δh′ in degrees. */
function hueDifference(first, second) {
  if (first.c * second.c === 0) return 0;
  const difference = second.h - first.h;
  if (Math.abs(difference) <= HALF_TURN) return difference;
  return difference > HALF_TURN ? difference - FULL_TURN : difference + FULL_TURN;
}

/** Mean hue h̄′ in degrees. */
function meanHue(first, second) {
  if (first.c * second.c === 0) return first.h + second.h;
  const sum = first.h + second.h;
  if (Math.abs(first.h - second.h) <= HALF_TURN) return sum / 2;
  return sum < FULL_TURN ? (sum + FULL_TURN) / 2 : (sum - FULL_TURN) / 2;
}

/** Hue weighting term T. */
function hueWeightingTerm(meanHueDegrees) {
  return CIEDE2000.hueTerms.reduce(
    (sum, term) => sum + term.weight * Math.cos((term.multiple * meanHueDegrees + term.offset) * RADIANS_PER_DEGREE),
    1,
  );
}

/** Rotation term R_T for the blue region. */
function rotationTerm(meanChroma, meanHueDegrees) {
  const exponent = ((meanHueDegrees - CIEDE2000.rotationPeakDegrees) / CIEDE2000.rotationWidthDegrees) ** 2;
  const deltaTheta = CIEDE2000.rotationScaleDegrees * Math.exp(-exponent);
  return -2 * chromaCompensation(meanChroma) * Math.sin(2 * deltaTheta * RADIANS_PER_DEGREE);
}

/** Lightness, chroma and hue weighting functions S_L, S_C, S_H. */
function weightingFunctions(meanLightness, meanChroma, meanHueDegrees) {
  const lightnessShift = (meanLightness - CIEDE2000.lightnessMid) ** 2;
  return {
    lightness: 1 + (CIEDE2000.lightnessWeight * lightnessShift) / Math.sqrt(CIEDE2000.lightnessOffset + lightnessShift),
    chroma: 1 + CIEDE2000.chromaWeight * meanChroma,
    hue: 1 + CIEDE2000.hueWeight * meanChroma * hueWeightingTerm(meanHueDegrees),
  };
}

/**
 * CIEDE2000 ΔE between two CIELAB colours.
 * @param {{l:number,a:number,b:number}} labA
 * @param {{l:number,a:number,b:number}} labB
 * @returns {number}
 */
export function deltaE2000(labA, labB) {
  const [first, second] = primeComponents(labA, labB);
  const meanLightness = (first.l + second.l) / 2;
  const meanChroma = (first.c + second.c) / 2;
  const averageHue = meanHue(first, second);
  const deltaHue = 2 * Math.sqrt(first.c * second.c) * Math.sin((hueDifference(first, second) / 2) * RADIANS_PER_DEGREE);
  const weights = weightingFunctions(meanLightness, meanChroma, averageHue);
  const k = CIEDE2000.parametricFactor;
  const lightnessTerm = (second.l - first.l) / (k * weights.lightness);
  const chromaTerm = (second.c - first.c) / (k * weights.chroma);
  const hueTerm = deltaHue / (k * weights.hue);
  return Math.sqrt(
    lightnessTerm ** 2 + chromaTerm ** 2 + hueTerm ** 2 + rotationTerm(meanChroma, averageHue) * chromaTerm * hueTerm,
  );
}
