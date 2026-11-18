/**
 * LUMÉA — Sends form data by fetch POST to a static form service (Web3Forms or
 * Formspree), which forwards it to the owner's email. Works on GitHub Pages
 * because no server of our own is involved.
 */
import { APP_CONFIG } from '../config/app-config.js';

const BOOKING = APP_CONFIG.booking;
const JSON_HEADERS = Object.freeze({ 'Content-Type': 'application/json', Accept: 'application/json' });
const PROVIDERS = Object.freeze({ web3forms: 'web3forms', formspree: 'formspree' });

/** Error with an operator-friendly Indonesian message. */
export class FormSendError extends Error {
  /**
   * @param {'not-configured'|'network'|'timeout'|'rejected'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'FormSendError';
    this.code = code;
  }
}

/**
 * Whether the chosen provider has its endpoint or key filled in.
 * @returns {boolean}
 */
export function isFormServiceConfigured() {
  if (BOOKING.provider === PROVIDERS.web3forms) return Boolean(BOOKING.web3forms.accessKey);
  if (BOOKING.provider === PROVIDERS.formspree) return Boolean(BOOKING.formspree.endpoint);
  return false;
}

/**
 * Endpoint and JSON body for the configured provider.
 * @param {string} subject
 * @param {Record<string,string>} fields
 * @returns {{endpoint:string, body:object}}
 */
function buildRequest(subject, fields) {
  if (BOOKING.provider === PROVIDERS.web3forms) {
    const body = { access_key: BOOKING.web3forms.accessKey, subject, from_name: BOOKING.fromName, ...fields };
    return { endpoint: BOOKING.web3forms.endpoint, body };
  }
  return { endpoint: BOOKING.formspree.endpoint, body: { _subject: subject, ...fields } };
}

/**
 * Reads the provider's answer: both services reply with JSON.
 * @param {Response} response
 * @returns {Promise<void>}
 * @throws {FormSendError}
 */
async function assertAccepted(response) {
  const payload = await response.json().catch(() => ({}));
  const isAccepted = response.ok && payload.success !== false;
  if (!isAccepted) {
    const detail = payload.message || payload.error || `kode ${response.status}`;
    throw new FormSendError('rejected', `Layanan form menolak kiriman (${detail}).`);
  }
}

/**
 * Sends a form.
 * @param {string} subject email subject
 * @param {Record<string,string>} fields name → value, shown in the email
 * @returns {Promise<void>}
 * @throws {FormSendError}
 */
export async function sendForm(subject, fields) {
  if (!isFormServiceConfigured()) {
    throw new FormSendError('not-configured', 'Form belum tersambung ke email. Isi access key Web3Forms atau endpoint Formspree di js/config/app-config.js.');
  }
  const { endpoint, body } = buildRequest(subject, fields);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BOOKING.requestTimeoutMilliseconds);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body), signal: controller.signal });
    await assertAccepted(response);
  } catch (error) {
    if (error instanceof FormSendError) throw error;
    if (error?.name === 'AbortError') throw new FormSendError('timeout', 'Server form terlalu lama menjawab. Coba lagi sebentar.');
    throw new FormSendError('network', 'Tidak bisa terhubung. Periksa koneksi internet lalu coba lagi.');
  } finally {
    clearTimeout(timer);
  }
}
