/**
 * LUMÉA — This laptop's copy of the session log in localStorage. Every booth session
 * is written here first, so nothing is lost when the internet drops; entries stay
 * marked unsynced until Supabase confirms them. Synced entries from past days are
 * pruned; unsynced ones are kept until they upload.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { readJson, writeJson } from '../storage/local-store.js';

const { storageKeys: KEYS, recap: RECAP } = APP_CONFIG;

/** @returns {object[]} every stored entry */
function readAll() {
  const stored = readJson(KEYS.sessionLog);
  return Array.isArray(stored?.entries) ? stored.entries : [];
}

/** @param {object[]} entries */
function writeAll(entries) {
  writeJson(KEYS.sessionLog, { entries });
}

/**
 * Drops synced entries of earlier days and caps the list.
 * @param {object[]} entries
 * @param {string} todayIso
 * @returns {object[]}
 */
function prune(entries, todayIso) {
  return entries.filter((entry) => !entry.synced || entry.sessionDate === todayIso).slice(0, RECAP.maxLogEntries);
}

/**
 * Entries of one day on this laptop.
 * @param {string} isoDate
 * @returns {object[]}
 */
export function loadLocalEntries(isoDate) {
  return readAll().filter((entry) => entry.sessionDate === isoDate);
}

/**
 * Entries not yet confirmed by Supabase (any day).
 * @returns {object[]}
 */
export function loadPendingEntries() {
  return readAll().filter((entry) => !entry.synced);
}

/**
 * Saves a new entry as unsynced.
 * @param {object} entry
 */
export function addLocalEntry(entry) {
  writeAll(prune([{ ...entry, synced: false }, ...readAll()], entry.sessionDate));
}

/**
 * Marks entries as stored in Supabase.
 * @param {ReadonlyArray<string>} uuids
 */
export function markSynced(uuids) {
  const done = new Set(uuids);
  writeAll(readAll().map((entry) => (done.has(entry.uuid) ? { ...entry, synced: true } : entry)));
}

/**
 * Removes one day from this laptop (Supabase is not touched).
 * @param {string} isoDate
 */
export function clearLocalDay(isoDate) {
  writeAll(readAll().filter((entry) => entry.sessionDate !== isoDate));
}

/**
 * Next session number for a booth laptop today (used in the passport number).
 * @param {string} deviceCode
 * @param {string} isoDate
 * @returns {number}
 */
export function nextDeviceSequence(deviceCode, isoDate) {
  return loadLocalEntries(isoDate).filter((entry) => entry.deviceCode === deviceCode).length + 1;
}

/**
 * Next number for an analysis outside booth mode (kept apart from the booth log).
 * @param {string} isoDate
 * @returns {number}
 */
export function nextPublicSequence(isoDate) {
  const stored = readJson(KEYS.publicCounter);
  const count = stored?.isoDate === isoDate ? stored.count + 1 : 1;
  writeJson(KEYS.publicCounter, { isoDate, count });
  return count;
}
