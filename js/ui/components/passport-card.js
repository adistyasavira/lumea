/**
 * LUMÉA — The Color Passport card (360 × 640 CSS px, exported at 3× = 1080 × 1920).
 * Used on the booth result screen and on the customer's phone.
 */
import { createElement } from '../dom.js';
import { createSwatchGrid, createColorStrip } from './swatch-grid.js';
import { createMetricBars } from './metric-bars.js';
import { APP_CONFIG } from '../../config/app-config.js';

/** Section title + content. */
function createSection(title, children, modifier) {
  return createElement('section', { className: `passport__section${modifier ? ` passport__section--${modifier}` : ''}` }, [
    createElement('h4', { className: 'passport__label', text: title }),
    ...children,
  ]);
}

/** Header: brand, passport number, nickname and date (the last three are optional in a link). */
function createHeader(passport) {
  const owner = passport.nickname ? passport.nickname : 'Tamu LUMÉA';
  const ownerLine = [owner, passport.dateLabel].filter(Boolean).join(' · ');
  return createElement('header', { className: 'passport__header' }, [
    createElement('span', { className: 'passport__brand', text: 'LUMÉA · Color Passport' }),
    createElement('span', { className: 'passport__id mono', text: passport.id || 'Personal Color' }),
    createElement('span', { className: 'passport__owner', text: ownerLine }),
  ]);
}

/** Confidence line: between two seasons, a percentage, or the measured traits when no percentage is known. */
function describeConfidence(passport) {
  const percent = passport.confidence === null || passport.confidence === undefined ? '' : ` · ${passport.confidence}%`;
  if (passport.secondary) return `Di antara ${passport.season.name} & ${passport.secondary.name}${percent}`;
  if (percent) return `Keyakinan ${passport.confidence}%`;
  return `${passport.labels.undertone} · ${passport.labels.lightness} · ${passport.labels.chroma}`;
}

/** Season name, tagline, confidence and measured skin chip. */
function createSeasonBlock(passport) {
  const confidenceText = describeConfidence(passport);
  return createElement('div', { className: 'passport__season' }, [
    createElement('div', { className: 'passport__season-text' }, [
      createElement('h3', { className: 'passport__season-name', text: passport.season.name }),
      createElement('p', { className: 'passport__tagline', text: passport.season.tagline }),
      createElement('p', { className: 'passport__confidence mono', text: confidenceText }),
    ]),
    createElement('div', { className: 'passport__skin' }, [
      createElement('span', { className: 'passport__skin-chip', vars: { swatch: passport.skinHex }, attrs: { 'aria-hidden': 'true' } }),
      createElement('span', { className: 'passport__skin-hex mono', text: passport.skinHex }),
      createElement('span', { className: 'passport__skin-caption', text: 'Kulit terukur' }),
    ]),
  ]);
}

/** Makeup section: foundation advice, blush and lip swatches. */
function createMakeupSection(season) {
  return createSection('Makeup', [
    createElement('p', { className: 'passport__foundation', text: `Foundation: ${season.makeup.foundation}` }),
    createElement('div', { className: 'passport__makeup-rows' }, [
      createElement('span', { className: 'passport__mini-label', text: 'Blush' }),
      createSwatchGrid(season.makeup.blush, { className: 'swatch-grid--inline', showHex: false }),
      createElement('span', { className: 'passport__mini-label', text: 'Lip' }),
      createSwatchGrid(season.makeup.lip, { className: 'swatch-grid--inline', showHex: false }),
    ]),
  ]);
}

/** Outfit formulas as colour strips. */
function createOutfitSection(passport) {
  const outfits = passport.outfits.map((outfit) => createElement('div', { className: 'passport__outfit' }, [
    createColorStrip(outfit.swatches.map((swatch) => swatch.hex), `${outfit.name}: ${outfit.swatches.map((swatch) => swatch.name).join(', ')}`),
    createElement('span', { className: 'passport__outfit-name', text: outfit.name }),
  ]));
  return createSection('Outfit · atasan, bawahan, aksen', [createElement('div', { className: 'passport__outfits' }, outfits)]);
}

/** Footer with site and optional social handle. */
function createFooter() {
  const { displayUrl, socialHandle } = APP_CONFIG.site;
  const credit = socialHandle ? `@${socialHandle} · ${displayUrl}` : displayUrl;
  return createElement('footer', { className: 'passport__footer' }, [
    createElement('span', { text: 'Ring light daylight · CIELAB' }),
    createElement('span', { className: 'mono', text: credit }),
  ]);
}

/**
 * Builds the passport card.
 * @param {object} passport expanded view model from passport-model expandPassport
 * @returns {HTMLElement}
 */
export function createPassportCard(passport) {
  const { season } = passport;
  return createElement('article', { className: 'passport', attrs: { 'aria-label': `Color Passport ${season.name}` } }, [
    createHeader(passport),
    createSeasonBlock(passport),
    createMetricBars(passport.metrics, { showCaption: false, className: 'metrics--compact' }),
    createSection('Palette terbaik', [createSwatchGrid(passport.palette, { className: 'swatch-grid--passport', showName: false })]),
    createSection('Hindari di dekat wajah', [createSwatchGrid(season.avoid, { className: 'swatch-grid--avoid', showName: false, isAvoid: true })]),
    createMakeupSection(season),
    createSection('Perhiasan', [createElement('p', { className: 'passport__metals', text: season.metals.join(' · ') })]),
    createOutfitSection(passport),
    createFooter(),
  ]);
}
