/**
 * LUMÉA — Recap tests: session entries, Supabase row mapping, merging both laptops,
 * the summary and the CSV export. Run with: node tests/recap.test.mjs
 */
import assert from 'node:assert/strict';
import { createSessionEntry, toRow, fromRow, mergeEntries } from '../js/recap/session-entry.js';
import { summarizeSessions } from '../js/recap/recap-summary.js';
import { buildCsv } from '../js/recap/csv-export.js';

const LAPTOP_1 = { code: 'L1', label: 'Laptop 1' };
const LAPTOP_2 = { code: 'L2', label: 'Laptop 2' };

const record = (id, seasonId, nickname = 'Dinda') => ({ id, nickname, isoDate: '2026-11-18', seasonId, confidence: 71 });

const first = createSessionEntry(record('LM-261118-L1-001', 'deep-autumn'), LAPTOP_1, 'solo', new Date('2026-11-18T09:05:00'));
const second = createSessionEntry(record('LM-261118-L2-001', 'deep-autumn', '=HYPERLINK("x")'), LAPTOP_2, 'bundle', new Date('2026-11-18T09:20:00'));
const third = createSessionEntry(record('LM-261118-L1-002', 'light-spring'), LAPTOP_1, 'bundle', new Date('2026-11-18T10:00:00'));

assert.equal(first.price, 15000);
assert.equal(second.price, 12500, 'bundle duo = 25.000 / 2 people');
assert.equal(second.packageCode, 'bundle');
assert.equal(createSessionEntry(record('X', 'deep-autumn'), LAPTOP_1, 'unknown').price, 15000, 'unknown package falls back to solo');
assert.equal(first.deviceCode, 'L1');
assert.equal(first.sessionDate, '2026-11-18');
assert.notEqual(first.uuid, second.uuid);

const roundTrip = fromRow(toRow(second));
assert.equal(roundTrip.uuid, second.uuid);
assert.equal(roundTrip.passportId, second.passportId);
assert.equal(roundTrip.deviceLabel, 'Laptop 2');
assert.equal(roundTrip.packageCode, 'bundle');
assert.equal(fromRow({ ...toRow(first), package_code: undefined }).packageCode, 'solo', 'old rows count as solo');

const merged = mergeEntries([first, second, third, { ...first }]);
assert.equal(merged.length, 3, 'duplicates by uuid are dropped');
assert.equal(merged[0].uuid, third.uuid, 'newest first');

const summary = summarizeSessions(merged);
assert.equal(summary.sessions, 3);
assert.equal(summary.revenue, 40000, '15.000 solo + 2 × 12.500 bundle');
assert.deepEqual(summary.packages, { solo: 1, bundle: 2 });
assert.equal(summary.topSeasonId, 'deep-autumn');
assert.deepEqual(summary.devices, { 'Laptop 1': 2, 'Laptop 2': 1 });

const csv = buildCsv(merged).split('\r\n');
assert.equal(csv[0], 'Tanggal;Jam;Perangkat;No Passport;Nama;Season;Keluarga;Keyakinan (%);Paket;Harga (Rp)');
assert.ok(csv[1].includes('LM-261118-L1-001'), 'oldest first');
assert.ok(csv[2].includes(`"'=HYPERLINK(""x"")"`), 'formula is neutralised');
assert.equal(csv.at(-1), 'TOTAL;;;3 sesi;;;;;;40000');

console.log('Semua tes rekap lulus.');
