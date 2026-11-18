/**
 * LUMÉA — Passport link tests: round trip, the short link format from the brief,
 * and rejection of broken links. Run with: node tests/passport-link.test.mjs
 */
import assert from 'node:assert/strict';
import { buildPassportUrl, decodePassportParams, encodePassportQuery } from '../js/passport/passport-link.js';
import { expandPassport } from '../js/passport/passport-model.js';
import { parseHash } from '../js/ui/router.js';

const record = {
  id: 'LM-261118-L1-007', nickname: 'Dinda', isoDate: '2026-11-18', seasonId: 'deep-autumn', secondaryId: 'deep-winter',
  confidence: 62, skinLab: { l: 58.2, a: 14.1, b: 22.3 }, contrastLevel: 'high', contrastDelta: 41.2,
};

const url = buildPassportUrl(record);
assert.ok(url.startsWith('https://adistyasavira.github.io/lumea/#passport?season=deep-autumn&L=58.2&a=14.1&b=22.3&contrast=high'), url);
const { route, params } = parseHash(new URL(url).hash, 'home');
assert.equal(route, 'passport');
assert.deepEqual(decodePassportParams(params), record);

const minimal = decodePassportParams(parseHash('#passport?season=deep-autumn&L=58&a=14&b=22&contrast=high', 'home').params);
assert.equal(minimal.seasonId, 'deep-autumn');
assert.equal(minimal.contrastDelta, 48);
assert.equal(minimal.confidence, null);
assert.equal(expandPassport(minimal).season.name, 'Deep Autumn');

const broken = ['season=unknown&L=58&a=14&b=22&contrast=high', 'season=deep-autumn&L=140&a=14&b=22&contrast=high', 'season=deep-autumn&L=58&a=14&contrast=high', 'season=deep-autumn&L=58&a=14&b=22&contrast=extreme'];
broken.forEach((query) => assert.equal(decodePassportParams(new URLSearchParams(query)), null, query));

assert.equal(parseHash('#/passport?season=x', 'home').route, 'passport');
assert.equal(new URLSearchParams(encodePassportQuery({ ...record, nickname: 'A&B C' })).get('name'), 'A&B C');
console.log('Semua tes link passport lulus.');
