/**
 * LUMÉA — Color Passport data. A compact *record* (what travels in the QR link) and
 * an expanded *view model* (what the card renders), both free of DOM code.
 *
 * The record stores the measured skin colour in CIELAB plus the contrast; the four
 * metric axes are recomputed from it, so the phone shows the same numbers as the booth.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { getSeasonById, resolveOutfitSwatches } from '../data/seasons.js';
import { computeIta, describeFeatures } from '../analysis/feature-extractor.js';
import { normalizeFeatures } from '../analysis/season-classifier.js';
import { labToHex, labToLch } from '../color/color-convert.js';

const { passport: PASSPORT, passportLink: LINK } = APP_CONFIG;
const DATE_PART_LENGTH = 2;
const SHORT_YEAR_START = 2;
const MONTH_OFFSET = 1;

/** Metric presentation: title, unit and the plain-language meaning of each axis. */
const METRIC_COPY = Object.freeze({
  lightness: { title: 'Lightness', unit: 'ITA°', caption: 'Seberapa terang kulit (Deep → Light)' },
  undertone: { title: 'Undertone', unit: 'h°', caption: 'Arah rona kulit (Cool → Warm)' },
  chroma: { title: 'Chroma', unit: 'C*', caption: 'Kejernihan warna kulit (Soft → Clear)' },
  contrast: { title: 'Contrast', unit: 'ΔL*', caption: 'Selisih terang kulit dan alis/rambut (Low → High)' },
});

const pad = (value) => String(value).padStart(DATE_PART_LENGTH, '0');

/**
 * Local calendar date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + MONTH_OFFSET)}-${pad(date.getDate())}`;
}

/**
 * Local time as HH:MM.
 * @param {Date} date
 * @returns {string}
 */
export function toClockTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Passport number, e.g. LM-261118-L1-042: date, device (L1, L2 for the booth
 * laptops, W outside booth mode) and that device's session number of the day.
 * @param {string} isoDate YYYY-MM-DD
 * @param {number} sequence session number of the day on that device
 * @param {string} deviceCode
 * @returns {string}
 */
export function createPassportId(isoDate, sequence, deviceCode) {
  const compactDate = isoDate.replaceAll('-', '').slice(SHORT_YEAR_START);
  return `${PASSPORT.idPrefix}-${compactDate}-${deviceCode}-${String(sequence).padStart(PASSPORT.sequencePadding, '0')}`;
}

/**
 * Rounds a number to the link precision.
 * @param {number} value
 * @returns {number}
 */
export function roundForLink(value) {
  const factor = 10 ** LINK.decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Contrast level word used in the link ('low' | 'medium' | 'high').
 * @param {number} contrastDelta ΔL* between skin and the darkest feature
 * @returns {string}
 */
export function toContrastLevel(contrastDelta) {
  return describeFeatures({ contrast: contrastDelta }).contrast.toLowerCase();
}

/**
 * Builds the compact record of one analysis.
 * @param {{features:object, classification:object, skinLab:object}} analysis
 * @param {{nickname:string, isoDate:string, sequence:number, deviceCode:string}} session
 * @returns {object}
 */
export function buildPassportRecord(analysis, session) {
  const { features, classification, skinLab } = analysis;
  return {
    id: createPassportId(session.isoDate, session.sequence, session.deviceCode),
    nickname: session.nickname,
    isoDate: session.isoDate,
    seasonId: classification.primary.id,
    secondaryId: classification.confidence.isAmbiguous ? classification.secondary.id : null,
    confidence: classification.confidence.percent,
    skinLab: { l: roundForLink(skinLab.l), a: roundForLink(skinLab.a), b: roundForLink(skinLab.b) },
    contrastLevel: toContrastLevel(features.contrast),
    contrastDelta: roundForLink(features.contrast),
  };
}

/**
 * The four measured axes, recomputed from the stored skin colour and contrast.
 * @param {{l:number,a:number,b:number}} skinLab
 * @param {number} contrastDelta
 * @returns {{lightness:number, undertone:number, chroma:number, contrast:number}}
 */
export function featuresFromRecord(skinLab, contrastDelta) {
  const { c, h } = labToLch(skinLab);
  return { lightness: computeIta(skinLab), undertone: h, chroma: c, contrast: contrastDelta };
}

/**
 * Metric rows with a 0–100 bar position.
 * @param {Record<string, number>} features
 * @returns {Array<{axis:string, title:string, unit:string, caption:string, value:number, label:string, position:number}>}
 */
export function buildMetrics(features) {
  const labels = describeFeatures(features);
  const vector = normalizeFeatures(features);
  const half = ENGINE_CONFIG.numeric.percent / 2;
  return Object.keys(METRIC_COPY).map((axis) => ({
    axis,
    ...METRIC_COPY[axis],
    value: features[axis],
    label: labels[axis],
    position: Math.round(half + vector[axis] * half),
  }));
}

/**
 * Human date in Indonesian, e.g. "17 November 2026"; empty when no date is known.
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(APP_CONFIG.booth.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/**
 * Expands a record into everything the result screen and passport card show.
 * @param {object} record
 * @returns {object|null} null when the season id is unknown
 */
export function expandPassport(record) {
  const season = getSeasonById(record.seasonId);
  if (!season) return null;
  const features = featuresFromRecord(record.skinLab, record.contrastDelta);
  return {
    ...record,
    season,
    secondary: record.secondaryId ? getSeasonById(record.secondaryId) : null,
    features,
    labels: describeFeatures(features),
    skinHex: labToHex(record.skinLab),
    dateLabel: formatDisplayDate(record.isoDate),
    metrics: buildMetrics(features),
    palette: season.palette.slice(0, PASSPORT.paletteSize),
    outfits: season.outfits.map((outfit) => ({ name: outfit.name, swatches: resolveOutfitSwatches(season, outfit) })),
  };
}
