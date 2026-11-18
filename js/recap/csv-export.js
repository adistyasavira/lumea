/**
 * LUMÉA — End-of-day CSV of the booth sessions (opens in Excel and Google Sheets).
 * Semicolon separated with a UTF-8 BOM, which Excel with Indonesian settings reads
 * correctly.
 */
import { APP_CONFIG } from '../config/app-config.js';
import { getSeasonById } from '../data/seasons.js';
import { findPackage } from './pricing.js';

const { recap: RECAP } = APP_CONFIG;
const BYTE_ORDER_MARK = '﻿';
const LINE_BREAK = '\r\n';
const NEEDS_QUOTES = /["\r\n;,]/;

const COLUMNS = Object.freeze([
  ['Tanggal', (entry) => entry.sessionDate],
  ['Jam', (entry) => entry.time],
  ['Perangkat', (entry) => entry.deviceLabel],
  ['No Passport', (entry) => entry.passportId],
  ['Nama', (entry) => entry.nickname],
  ['Season', (entry) => getSeasonById(entry.seasonId)?.name ?? entry.seasonId],
  ['Keluarga', (entry) => getSeasonById(entry.seasonId)?.family ?? ''],
  ['Keyakinan (%)', (entry) => entry.confidence ?? ''],
  ['Paket', (entry) => findPackage(entry.packageCode).label],
  ['Harga (Rp)', (entry) => entry.price],
]);

/**
 * Quotes a cell when needed; a leading = + - @ is neutralised so spreadsheets never
 * run a typed nickname as a formula.
 * @param {unknown} value
 * @returns {string}
 */
function toCell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * CSV text for entries, oldest first, with a total line.
 * @param {ReadonlyArray<object>} entries
 * @returns {string}
 */
export function buildCsv(entries) {
  const separator = RECAP.csvSeparator;
  const ordered = [...entries].sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  const header = COLUMNS.map(([title]) => title).join(separator);
  const rows = ordered.map((entry) => COLUMNS.map(([, read]) => toCell(read(entry))).join(separator));
  const total = ordered.reduce((sum, entry) => sum + entry.price, 0);
  const totalRow = ['TOTAL', '', '', `${ordered.length} sesi`, '', '', '', '', '', total].map(toCell).join(separator);
  return [header, ...rows, totalRow].join(LINE_BREAK);
}

/**
 * Downloads the CSV.
 * @param {ReadonlyArray<object>} entries
 * @param {string} isoDate
 */
export function downloadCsv(entries, isoDate) {
  const blob = new Blob([BYTE_ORDER_MARK, buildCsv(entries)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${RECAP.csvFileNamePrefix}-${isoDate}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
