/**
 * LUMÉA — Pure recap maths: session count, revenue, season tally, top season and
 * people per package.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { findPackage, pricePerPerson } from './pricing.js';

const { booth: BOOTH } = APP_CONFIG;

/**
 * @param {ReadonlyArray<{seasonId:string, deviceLabel:string, packageCode:string, price:number}>} entries
 * @returns {{sessions:number, revenue:number, seasons:Record<string,number>, topSeasonId:string|null, devices:Record<string,number>, packages:Record<string,number>}}
 */
export function summarizeSessions(entries) {
  const seasons = {};
  const devices = {};
  const packages = Object.fromEntries(Object.keys(BOOTH.packages).map((code) => [code, 0]));
  entries.forEach((entry) => {
    seasons[entry.seasonId] = (seasons[entry.seasonId] ?? 0) + 1;
    devices[entry.deviceLabel] = (devices[entry.deviceLabel] ?? 0) + 1;
    packages[findPackage(entry.packageCode).code] += 1;
  });
  const [topSeasonId = null] = Object.entries(seasons).sort((first, second) => second[1] - first[1])[0] ?? [];
  const revenue = entries.reduce((sum, entry) => sum + (Number.isFinite(entry.price) ? entry.price : pricePerPerson(entry.packageCode)), 0);
  return { sessions: entries.length, revenue, seasons, topSeasonId, devices, packages };
}

/**
 * Rupiah, e.g. "Rp 15.000".
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  return new Intl.NumberFormat(BOOTH.locale, { style: 'currency', currency: BOOTH.currency, maximumFractionDigits: 0 }).format(amount);
}
