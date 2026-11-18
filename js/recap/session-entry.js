/**
 * LUMÉA — One recorded booth session, and its mapping to the Supabase row.
 * Each entry gets a random id on the laptop, so retries after an offline spell
 * can never create duplicates.
 */
import { toIsoDate, toClockTime } from '../passport/passport-model.js';
import { findPackage, pricePerPerson } from './pricing.js';

/**
 * A random UUID (crypto.randomUUID needs HTTPS or localhost, which the booth always is).
 * @returns {string}
 */
function createUuid() {
  return globalThis.crypto.randomUUID();
}

/**
 * Builds the entry for a finished analysis.
 * @param {{id:string, nickname:string, seasonId:string, confidence:number|null}} record passport record
 * @param {{code:string, label:string}} device booth laptop
 * @param {string} packageCode 'solo' or 'bundle' (see APP_CONFIG.booth.packages)
 * @param {Date} [now]
 * @returns {object}
 */
export function createSessionEntry(record, device, packageCode, now = new Date()) {
  return {
    uuid: createUuid(),
    sessionDate: toIsoDate(now),
    time: toClockTime(now),
    createdAt: now.toISOString(),
    passportId: record.id,
    nickname: record.nickname,
    seasonId: record.seasonId,
    confidence: record.confidence,
    deviceCode: device.code,
    deviceLabel: device.label,
    packageCode: findPackage(packageCode).code,
    price: pricePerPerson(packageCode),
  };
}

/**
 * Entry → database row (snake_case columns of supabase/schema.sql).
 * @param {object} entry
 * @returns {object}
 */
export function toRow(entry) {
  return {
    id: entry.uuid,
    session_date: entry.sessionDate,
    session_time: entry.time,
    created_at: entry.createdAt,
    passport_id: entry.passportId,
    nickname: entry.nickname || null,
    season_id: entry.seasonId,
    confidence: entry.confidence,
    device_code: entry.deviceCode,
    device_label: entry.deviceLabel,
    package_code: entry.packageCode,
    price: entry.price,
  };
}

/**
 * Database row → entry.
 * @param {object} row
 * @returns {object}
 */
export function fromRow(row) {
  return {
    uuid: row.id,
    sessionDate: row.session_date,
    time: row.session_time,
    createdAt: row.created_at,
    passportId: row.passport_id,
    nickname: row.nickname ?? '',
    seasonId: row.season_id,
    confidence: row.confidence,
    deviceCode: row.device_code,
    deviceLabel: row.device_label,
    packageCode: findPackage(row.package_code).code,
    price: row.price,
  };
}

/**
 * Newest first, without duplicate ids.
 * @param {ReadonlyArray<object>} entries
 * @returns {object[]}
 */
export function mergeEntries(entries) {
  const byId = new Map(entries.map((entry) => [entry.uuid, entry]));
  return [...byId.values()].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
