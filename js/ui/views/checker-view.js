/**
 * LUMÉA — "What suits me?": checks any colour against a season with CIEDE2000 and
 * suggests the closest colours from the palette. The season comes from the link
 * (#what-suits-me?season=deep-autumn) or the select box.
 */
import { APP_CONFIG } from '../../config/app-config.js';
import { SEASONS, getSeasonById } from '../../data/seasons.js';
import { checkColor, CHECK_VERDICTS } from '../../passport/color-checker.js';
import { hexToLab } from '../../color/color-convert.js';
import { deltaE2000 } from '../../color/delta-e.js';
import { query, delegate, replaceChildren, createElement, setHidden } from '../dom.js';

const { checker: CHECKER } = APP_CONFIG;
const SEASON_PARAM = 'season';
const HEX_PREFIX = '#';

/** Shades customers often ask about. */
const PRESET_SHADES = Object.freeze([
  { name: 'Terracotta', hex: '#C85A32' },
  { name: 'Electric Blue', hex: '#00E5FF' },
  { name: 'Dusty Rose', hex: '#D8A49B' },
  { name: 'Olive Green', hex: '#656D4A' },
  { name: 'Bright Yellow', hex: '#FFEA00' },
  { name: 'Navy Blue', hex: '#1D3557' },
  { name: 'Hitam', hex: '#111111' },
  { name: 'Putih Bersih', hex: '#FFFFFF' },
]);

const VERDICT_COPY = Object.freeze({
  [CHECK_VERDICTS.match]: { badge: 'Harmonious Match', tone: 'harmonious', title: 'This color suits you.', body: 'Warna ini hampir sama dengan salah satu warna terbaikmu. Aman dipakai di dekat wajah.' },
  [CHECK_VERDICTS.near]: { badge: 'Close Match', tone: 'harmonious', title: 'Close to your palette.', body: 'Masih satu keluarga dengan palette-mu. Cocok sebagai atasan atau aksen.' },
  [CHECK_VERDICTS.avoid]: { badge: 'Exploration Note', tone: 'less-harmonious', title: 'Keep this color away from your face.', body: 'Warna ini lebih dekat ke daftar Hindari. Pakai untuk bawahan, tas, atau sepatu, atau coba alternatif di bawah.' },
  [CHECK_VERDICTS.neutral]: { badge: 'Exploration Note', tone: 'less-harmonious', title: 'This color may feel less harmonious.', body: 'Tidak dekat dengan palette-mu. Untuk membawa cahaya ke wajah, coba alternatif dari palette-mu di bawah.' },
});

/**
 * The palette colours closest to a hex, nearest first.
 * @param {string} hex
 * @param {object} season
 * @returns {Array<{name:string, hex:string}>}
 */
function findAlternatives(hex, season) {
  const lab = hexToLab(hex);
  return season.palette
    .map((swatch) => ({ swatch, deltaE: deltaE2000(lab, hexToLab(swatch.hex)) }))
    .sort((first, second) => first.deltaE - second.deltaE)
    .slice(0, CHECKER.alternativesCount)
    .map((entry) => entry.swatch);
}

/**
 * Adds "#" and upper-cases a typed hex value.
 * @param {string} value
 * @returns {string}
 */
function normaliseHex(value) {
  const trimmed = value.trim();
  return (trimmed.startsWith(HEX_PREFIX) ? trimmed : `${HEX_PREFIX}${trimmed}`).toUpperCase();
}

/** Controls the What suits me? view. */
export class CheckerView {
  /**
   * @param {{root:HTMLElement, notify:(message:string, tone?:string)=>void}} deps
   */
  constructor({ root, notify }) {
    this.root = root;
    this.notify = notify;
    this.form = query('[data-form="checker"]', root);
    this.picker = query('[data-checker-picker]', root);
    this.hexInput = query('[data-checker-hex]', root);
    this.seasonSelect = query('[data-checker-season]', root);
    this.renderSeasonOptions();
    this.renderPresets();
    this.picker.addEventListener('input', () => { this.hexInput.value = this.picker.value.toUpperCase(); });
    this.hexInput.addEventListener('input', () => {
      const hex = normaliseHex(this.hexInput.value);
      if (hexToLab(hex)) this.picker.value = hex.toLowerCase();
    });
    delegate(root, 'click', '[data-preset-hex]', (event, target) => this.selectColor(target.dataset.presetHex));
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.check();
    });
  }

  /** Season choices grouped by family. */
  renderSeasonOptions() {
    const families = [...new Set(SEASONS.map((season) => season.family))];
    const groups = families.map((family) => createElement('optgroup', { attrs: { label: family } },
      SEASONS.filter((season) => season.family === family).map((season) => createElement('option', { text: season.name, attrs: { value: season.id } }))));
    replaceChildren(this.seasonSelect, groups);
  }

  renderPresets() {
    const chips = PRESET_SHADES.map((shade) => createElement('button', {
      className: 'preset-chip',
      vars: { swatch: shade.hex },
      attrs: { type: 'button', title: shade.name, 'aria-label': `Coba ${shade.name} ${shade.hex}` },
      dataset: { presetHex: shade.hex },
    }));
    replaceChildren(query('[data-checker-presets]', this.root), chips);
  }

  /**
   * Called by the router; picks the season from the link when present.
   * @param {URLSearchParams} params
   */
  show(params) {
    const season = getSeasonById(params.get(SEASON_PARAM) ?? '');
    if (season) this.seasonSelect.value = season.id;
  }

  hide() {}

  selectColor(hex) {
    this.picker.value = hex.toLowerCase();
    this.hexInput.value = hex.toUpperCase();
  }

  /** Runs the check and shows the verdict card. */
  check() {
    const season = getSeasonById(this.seasonSelect.value);
    const hex = normaliseHex(this.hexInput.value);
    const result = season ? checkColor(hex, season) : null;
    if (!result) {
      this.notify(`Format hex belum benar. Contoh: ${CHECKER.defaultHex}`, 'error');
      return;
    }
    this.renderResult(hex, result, season);
  }

  /** Verdict, ΔE2000 to the nearest colour and alternatives when the colour misses. */
  renderResult(hex, result, season) {
    const copy = VERDICT_COPY[result.verdict];
    const showAlternatives = result.verdict === CHECK_VERDICTS.avoid || result.verdict === CHECK_VERDICTS.neutral;
    const alternatives = showAlternatives ? findAlternatives(hex, season) : [result.nearest.swatch];
    const card = query('[data-checker-result]', this.root);
    replaceChildren(card, [
      createElement('span', { className: `result-status-badge status-${copy.tone}`, text: copy.badge }),
      createElement('div', { className: 'checker-verdict' }, [
        createElement('span', { className: 'checker-verdict__chip', vars: { swatch: hex }, attrs: { 'aria-hidden': 'true' } }),
        createElement('div', {}, [
          createElement('h3', { className: 'checker-verdict__title', text: copy.title }),
          createElement('p', { text: copy.body }),
          createElement('p', { className: 'checker-verdict__delta mono', text: `${hex} · ΔE2000 ke ${result.nearest.swatch.name}: ${result.nearest.deltaE.toFixed(1)} · ${season.name}` }),
        ]),
      ]),
      createElement('span', { className: 'chip-list-label', text: showAlternatives ? 'TRY THESE INSTEAD:' : 'CLOSEST IN YOUR PALETTE:' }),
      createElement('div', { className: 'alternatives-swatch-row' }, alternatives.map((swatch) => createElement('span', { className: 'alt-swatch-chip' }, [
        createElement('span', { className: 'alt-swatch-chip__dot', vars: { swatch: swatch.hex }, attrs: { 'aria-hidden': 'true' } }),
        createElement('span', { text: `${swatch.name} ${swatch.hex}` }),
      ]))),
    ]);
    setHidden(card, false);
  }
}
