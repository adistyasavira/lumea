/**
 * LUMÉA — Readable passport link for the QR code, and the reader on the customer's
 * phone. Everything travels in the hash, e.g.
 *   https://adistyasavira.github.io/lumea/#passport?season=deep-autumn&L=58.2&a=14.1&b=22.3&contrast=high&dL=41.2
 * The hash is never sent to the server, so GitHub Pages always answers with
 * index.html (no 404) and no booth storage is needed. Only numbers and the
 * nickname travel; never the photo.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { getSeasonById } from '../data/seasons.js';

const { site: SITE, passportLink: LINK, booth: BOOTH } = APP_CONFIG;
const PARAMS = LINK.params;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PASSPORT_ID_PATTERN = /^[A-Z]{2}-\d{6}-([A-Z0-9]{1,3}-)?\d{3,}$/;

/**
 * Ordered query entries of a record; empty optional values are left out.
 * @param {object} record
 * @returns {Array<[string, string]>}
 */
function toEntries(record) {
  const entries = [
    [PARAMS.season, record.seasonId],
    [PARAMS.lightness, record.skinLab.l],
    [PARAMS.greenRed, record.skinLab.a],
    [PARAMS.blueYellow, record.skinLab.b],
    [PARAMS.contrast, record.contrastLevel],
    [PARAMS.contrastDelta, record.contrastDelta],
    [PARAMS.secondary, record.secondaryId],
    [PARAMS.confidence, record.confidence],
    [PARAMS.nickname, record.nickname],
    [PARAMS.id, record.id],
    [PARAMS.date, record.isoDate],
  ];
  return entries.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => [key, String(value)]);
}

/**
 * Query string of a record (without the leading "?").
 * @param {object} record
 * @returns {string}
 */
export function encodePassportQuery(record) {
  return new URLSearchParams(toEntries(record)).toString();
}

/**
 * Public link that opens the passport on the customer's phone.
 * @param {object} record
 * @returns {string}
 */
export function buildPassportUrl(record) {
  return `${SITE.baseUrl}#${LINK.route}?${encodePassportQuery(record)}`;
}

/**
 * A finite number from a parameter, or null.
 * @param {URLSearchParams} params
 * @param {string} key
 * @returns {number|null}
 */
function readNumber(params, key) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Skin colour from the link, or null when missing or outside CIELAB.
 * @param {URLSearchParams} params
 * @returns {{l:number,a:number,b:number}|null}
 */
function readSkinLab(params) {
  const lab = { l: readNumber(params, PARAMS.lightness), a: readNumber(params, PARAMS.greenRed), b: readNumber(params, PARAMS.blueYellow) };
  const { lightnessMin, lightnessMax, chromaticMax } = LINK.labLimits;
  const isLightnessValid = lab.l !== null && lab.l >= lightnessMin && lab.l <= lightnessMax;
  const isChromaticValid = [lab.a, lab.b].every((value) => value !== null && Math.abs(value) <= chromaticMax);
  return isLightnessValid && isChromaticValid ? lab : null;
}

/**
 * Contrast level and ΔL*; the level alone is enough (a typical ΔL* is used for the bar).
 * @param {URLSearchParams} params
 * @returns {{contrastLevel:string, contrastDelta:number}|null}
 */
function readContrast(params) {
  const level = (params.get(PARAMS.contrast) ?? '').toLowerCase();
  if (!LINK.contrastLevels.includes(level)) return null;
  const delta = readNumber(params, PARAMS.contrastDelta);
  return { contrastLevel: level, contrastDelta: delta ?? LINK.contrastFallbackDelta[level] };
}

/**
 * Optional fields: second season, confidence, nickname, passport number and date.
 * @param {URLSearchParams} params
 * @returns {object}
 */
function readOptionalFields(params) {
  const secondaryId = params.get(PARAMS.secondary);
  const confidence = readNumber(params, PARAMS.confidence);
  const id = (params.get(PARAMS.id) ?? '').toUpperCase();
  const isoDate = params.get(PARAMS.date) ?? '';
  return {
    secondaryId: secondaryId && getSeasonById(secondaryId) ? secondaryId : null,
    confidence: confidence !== null && confidence >= 0 && confidence <= LINK.confidenceMax ? Math.round(confidence) : null,
    nickname: (params.get(PARAMS.nickname) ?? '').trim().slice(0, BOOTH.nicknameMaxLength),
    id: PASSPORT_ID_PATTERN.test(id) ? id : '',
    isoDate: ISO_DATE_PATTERN.test(isoDate) ? isoDate : '',
  };
}

/**
 * Reads a passport record from the link parameters.
 * @param {URLSearchParams} params
 * @returns {object|null} null when the season, skin colour or contrast is missing or invalid
 */
export function decodePassportParams(params) {
  const seasonId = (params.get(PARAMS.season) ?? '').toLowerCase();
  const skinLab = readSkinLab(params);
  const contrast = readContrast(params);
  if (!getSeasonById(seasonId) || !skinLab || !contrast) return null;
  return { seasonId, skinLab, ...contrast, ...readOptionalFields(params) };
}
