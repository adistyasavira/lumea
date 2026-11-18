/**
 * LUMÉA — One entry point for the booth session log. Every session is saved on this
 * laptop first, then uploaded to Supabase when it is configured and online. The
 * recap reads both laptops from Supabase and falls back to this laptop's own copy
 * when Supabase is not configured or unreachable.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { mergeEntries } from './session-entry.js';
import { addLocalEntry, loadLocalEntries, loadPendingEntries, markSynced, clearLocalDay } from './local-session-store.js';
import { isCloudConfigured, uploadEntries, fetchDay, subscribeToInserts } from './supabase-session-store.js';

const { sync: SYNC } = APP_CONFIG;

/** Where the recap numbers came from. */
export const RECAP_SOURCES = Object.freeze({ cloud: 'cloud', local: 'local', offline: 'offline' });

/**
 * Uploads every unsynced entry of this laptop.
 * @returns {Promise<boolean>} true when nothing is left pending
 */
export async function syncPending() {
  const pending = loadPendingEntries();
  if (!isCloudConfigured() || pending.length === 0) return pending.length === 0;
  try {
    await uploadEntries(pending);
    markSynced(pending.map((entry) => entry.uuid));
    return true;
  } catch {
    return false;
  }
}

/**
 * Records a booth session.
 * @param {object} entry from createSessionEntry
 * @returns {Promise<{synced:boolean}>} synced is false when it waits for the internet
 */
export async function recordBoothSession(entry) {
  addLocalEntry(entry);
  return { synced: isCloudConfigured() ? await syncPending() : false };
}

/**
 * Sessions of one day, newest first.
 * @param {string} isoDate
 * @returns {Promise<{entries:object[], source:string, pendingCount:number}>}
 */
export async function loadDay(isoDate) {
  const local = loadLocalEntries(isoDate);
  if (!isCloudConfigured()) return { entries: local, source: RECAP_SOURCES.local, pendingCount: 0 };
  await syncPending();
  const pending = loadPendingEntries().filter((entry) => entry.sessionDate === isoDate);
  try {
    const remote = await fetchDay(isoDate);
    return { entries: mergeEntries([...remote, ...pending]), source: RECAP_SOURCES.cloud, pendingCount: pending.length };
  } catch {
    return { entries: local, source: RECAP_SOURCES.offline, pendingCount: pending.length };
  }
}

/**
 * Removes one day from this laptop only; the shared Supabase log is never deleted
 * from the website (do that in the Supabase dashboard if really needed).
 * @param {string} isoDate
 */
export function clearLocalCopy(isoDate) {
  clearLocalDay(isoDate);
}

/**
 * Keeps the recap fresh: realtime inserts from the other laptop, a periodic refresh,
 * and an upload retry when the internet comes back.
 * @param {() => void} onChange
 * @returns {() => void} stop watching
 */
export function watchSessions(onChange) {
  const retry = () => syncPending().then(onChange);
  const refreshTimer = setInterval(onChange, SYNC.refreshIntervalMilliseconds);
  window.addEventListener('online', retry);
  let unsubscribe = () => {};
  let isStopped = false;
  if (isCloudConfigured()) {
    subscribeToInserts(onChange).then((stop) => {
      if (isStopped) stop();
      else unsubscribe = stop;
    }).catch(() => {});
  }
  return () => {
    isStopped = true;
    clearInterval(refreshTimer);
    window.removeEventListener('online', retry);
    unsubscribe();
  };
}

/**
 * Background retry of queued sessions while the booth page is open.
 * @returns {() => void} stop retrying
 */
export function startPendingRetry() {
  if (!isCloudConfigured()) return () => {};
  const timer = setInterval(syncPending, SYNC.retryIntervalMilliseconds);
  window.addEventListener('online', syncPending);
  return () => {
    clearInterval(timer);
    window.removeEventListener('online', syncPending);
  };
}
