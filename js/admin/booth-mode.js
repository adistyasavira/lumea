/**
 * LUMÉA — Booth mode: the admin PIN gate and which booth laptop this browser is.
 * Booth mode is remembered per browser, so the two booth laptops stay unlocked for
 * the day while visitors' own phones never are.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { readJson, writeJson, removeKey } from '../storage/local-store.js';

const { admin: ADMIN, storageKeys: KEYS } = APP_CONFIG;

/**
 * Whether a typed PIN matches the configured one.
 * @param {string} pin
 * @returns {boolean}
 */
export function verifyPin(pin) {
  return String(pin).trim() === ADMIN.pin;
}

/**
 * Booth device by code, or null.
 * @param {string} code
 * @returns {{code:string, label:string}|null}
 */
export function findDevice(code) {
  return ADMIN.devices.find((device) => device.code === code) ?? null;
}

/**
 * The booth device this browser is set to, or null when booth mode is off.
 * @returns {{code:string, label:string}|null}
 */
export function getBoothDevice() {
  const stored = readJson(KEYS.boothMode);
  return stored?.enabled ? findDevice(stored.deviceCode) : null;
}

/**
 * @returns {boolean}
 */
export function isBoothMode() {
  return getBoothDevice() !== null;
}

/**
 * Turns booth mode on for this browser.
 * @param {string} deviceCode one of ADMIN.devices
 * @returns {boolean} false when the device code is unknown or storage is blocked
 */
export function enableBoothMode(deviceCode) {
  if (!findDevice(deviceCode)) return false;
  return writeJson(KEYS.boothMode, { enabled: true, deviceCode });
}

/** Turns booth mode off for this browser. */
export function disableBoothMode() {
  removeKey(KEYS.boothMode);
}
