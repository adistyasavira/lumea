/**
 * LUMÉA — Booth package prices. A recorded session is always one person, so a
 * Bundle Duo counts as price / people per analysis (Rp 25.000 / 2 = Rp 12.500).
 */
import { APP_CONFIG } from '../config/app-config.js';

const { booth: BOOTH } = APP_CONFIG;

/**
 * Package by code; unknown or missing codes fall back to the default (solo).
 * @param {string} [code]
 * @returns {{code:string, label:string, shortLabel:string, people:number, price:number}}
 */
export function findPackage(code) {
  return Object.values(BOOTH.packages).find((item) => item.code === code) ?? BOOTH.packages[BOOTH.defaultPackage];
}

/**
 * Revenue of one recorded person in a package.
 * @param {string} [code]
 * @returns {number}
 */
export function pricePerPerson(code) {
  const item = findPackage(code);
  return Math.round(item.price / item.people);
}
