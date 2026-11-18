/**
 * LUMÉA — Shared session log in Supabase, so Laptop 1 and Laptop 2 see one recap.
 * The supabase-js library is loaded from the CDN only when a project URL is
 * configured, so public visitors never download it.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { toRow, fromRow } from './session-entry.js';

const { sync: SYNC } = APP_CONFIG;
const CHANNEL_NAME = 'lumea-booth-sessions';

let clientPromise = null;

/**
 * Whether a Supabase project is configured.
 * @returns {boolean}
 */
export function isCloudConfigured() {
  return Boolean(SYNC.supabaseUrl && SYNC.supabaseAnonKey);
}

/**
 * Loads a classic script once.
 * @param {string} url
 * @returns {Promise<void>}
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Library Supabase tidak termuat.'));
    document.head.append(script);
  });
}

/**
 * The Supabase client (created once).
 * @returns {Promise<object>}
 */
function getClient() {
  if (!clientPromise) {
    clientPromise = (globalThis.supabase ? Promise.resolve() : loadScript(SYNC.libraryUrl))
      .then(() => globalThis.supabase.createClient(SYNC.supabaseUrl, SYNC.supabaseAnonKey, { auth: { persistSession: false } }))
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

/**
 * Rejects when a request takes longer than the configured timeout.
 * @param {Promise<any>} promise
 * @returns {Promise<any>}
 */
function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase tidak menjawab (timeout).')), SYNC.requestTimeoutMilliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Throws the Supabase error of a response, if any.
 * @param {{error:object|null}} response
 * @returns {object} the same response
 */
function assertOk(response) {
  if (response.error) throw new Error(response.error.message);
  return response;
}

/**
 * Uploads entries; already uploaded ids are ignored, so retries are safe.
 * @param {ReadonlyArray<object>} entries
 * @returns {Promise<void>}
 */
export async function uploadEntries(entries) {
  if (entries.length === 0) return;
  const client = await getClient();
  const request = client.from(SYNC.table).upsert(entries.map(toRow), { onConflict: 'id', ignoreDuplicates: true });
  assertOk(await withTimeout(request));
}

/**
 * Every session of one day from both laptops.
 * @param {string} isoDate
 * @returns {Promise<object[]>}
 */
export async function fetchDay(isoDate) {
  const client = await getClient();
  const request = client.from(SYNC.table).select('*').eq('session_date', isoDate).order('created_at', { ascending: false });
  const { data } = assertOk(await withTimeout(request));
  return (data ?? []).map(fromRow);
}

/**
 * Calls `onChange` whenever the other laptop adds a session (Supabase Realtime).
 * @param {() => void} onChange
 * @returns {Promise<() => void>} unsubscribe
 */
export async function subscribeToInserts(onChange) {
  const client = await getClient();
  const channel = client
    .channel(CHANNEL_NAME)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: SYNC.table }, () => onChange())
    .subscribe();
  return () => client.removeChannel(channel);
}
