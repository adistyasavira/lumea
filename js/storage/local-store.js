/**
 * LUMÉA — Safe JSON access to localStorage. Private mode, a full quota or blocked
 * storage never break the app: reads return null and writes report failure.
 */

/**
 * Reads a JSON value.
 * @param {string} key
 * @returns {any|null} null when missing, unreadable or blocked
 */
export function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Writes a JSON value.
 * @param {string} key
 * @param {any} value
 * @returns {boolean} false when storage is unavailable
 */
export function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key.
 * @param {string} key
 */
export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing stored, nothing to remove.
  }
}
