/**
 * LUMÉA — Step 03 "Your palette": season banner, measured numbers, best colours by
 * category, colours to explore less, digital drape, the passport card and the QR
 * link that opens the passport on the customer's phone.
 */
import { query, replaceChildren, bindText, setHidden, createElement } from '../dom.js';
import { createMetricBars } from '../components/metric-bars.js';
import { createDrapePanels } from '../components/drape-panels.js';
import { createPassportCard } from '../components/passport-card.js';
import { createQrElement } from '../../passport/passport-qr.js';
import { buildHash } from '../router.js';

/** Clothing colours listed in the CLOTHING card. */
const CLOTHING_COUNT = 6;
const METAL_GLYPH = '✦';

/**
 * One row of a category card: colour dot and name (hex as tooltip).
 * @param {{name:string, hex:string}} swatch
 * @returns {HTMLElement}
 */
function createCategoryItem(swatch) {
  return createElement('div', { className: 'cat-swatch-item', attrs: { title: swatch.hex } }, [
    createElement('span', { className: 'cat-swatch-color', vars: { swatch: swatch.hex }, attrs: { 'aria-hidden': 'true' } }),
    createElement('span', { text: swatch.name }),
    createElement('span', { className: 'cat-swatch-hex mono', text: swatch.hex }),
  ]);
}

/** Season banner: family, name, tagline, trait pills, confidence and notes. */
function renderBanner(root, passport, wasReady) {
  const { season, secondary, labels } = passport;
  bindText(root, 'result-family', `Your Luméa Palette · ${season.family} family`);
  bindText(root, 'result-season', season.name);
  bindText(root, 'result-tagline', season.tagline);
  bindText(root, 'result-confidence', `${passport.confidence}%`);
  bindText(root, 'result-description', season.description);
  const pills = [labels.undertone, labels.lightness, labels.chroma, `${labels.contrast} contrast`];
  replaceChildren(query('[data-result-traits]', root), pills.map((text) => createElement('span', { className: 'trait-pill', text })));
  const secondaryNote = query('[data-bind="result-secondary"]', root);
  setHidden(secondaryNote, !secondary);
  secondaryNote.textContent = secondary ? `Hasilmu berada di antara ${season.name} dan ${secondary.name}. Coba keduanya di drape.` : '';
  const qualityNote = query('[data-bind="result-quality-note"]', root);
  setHidden(qualityNote, wasReady);
  qualityNote.textContent = wasReady ? '' : 'Foto diambil walau indikator belum semua baik, jadi keyakinan diturunkan.';
}

/** Horizontal hero bar with every palette colour and its hex. */
function renderHeroSwatches(root, palette) {
  const items = palette.map((swatch) => createElement('div', { className: 'result-swatch-item', vars: { swatch: swatch.hex }, attrs: { title: swatch.name } }, [
    createElement('span', { text: swatch.hex }),
  ]));
  replaceChildren(query('[data-result-hero]', root), items);
}

/** CLOTHING, MAKEUP, ACCESSORIES and the explore-less list. */
function renderCategories(root, season) {
  replaceChildren(query('[data-result-clothing]', root), season.palette.slice(0, CLOTHING_COUNT).map(createCategoryItem));
  replaceChildren(query('[data-result-makeup]', root), [...season.makeup.blush, ...season.makeup.lip].map(createCategoryItem));
  const metals = season.metals.map((metal) => createElement('div', { className: 'cat-swatch-item' }, [
    createElement('span', { className: 'cat-metal-glyph', text: METAL_GLYPH, attrs: { 'aria-hidden': 'true' } }),
    createElement('span', { text: metal }),
  ]));
  replaceChildren(query('[data-result-metals]', root), metals);
  replaceChildren(query('[data-result-avoid]', root), season.avoid.map(createCategoryItem));
}

/** QR code or a readable fallback when the QR library is offline. */
function renderHandoff(root, passport, passportUrl) {
  const qr = createQrElement(passportUrl, 'QR untuk membuka Digital Color Passport di HP');
  const fallback = createElement('p', { className: 'qr__fallback', text: 'QR tidak termuat (offline). Gunakan tombol Download PNG.' });
  replaceChildren(query('[data-qr]', root), [qr ?? fallback]);
  query('[data-passport-link]', root).href = passportUrl;
  query('[data-checker-link]', root).href = buildHash('what-suits-me', { season: passport.season.id });
}

/**
 * Renders the whole result step.
 * @param {HTMLElement} root the result step element
 * @param {{passport:object, oval:object, stillCanvas:HTMLCanvasElement, passportUrl:string, wasReady:boolean}} model
 */
export function renderResult(root, model) {
  const { passport } = model;
  renderBanner(root, passport, model.wasReady);
  renderHeroSwatches(root, passport.palette);
  replaceChildren(query('[data-metrics]', root), [createMetricBars(passport.metrics)]);
  renderCategories(root, passport.season);
  replaceChildren(query('[data-drape]', root), createDrapePanels(model.stillCanvas, model.oval, passport.season));
  replaceChildren(query('[data-passport-mount]', root), [createPassportCard(passport)]);
  renderHandoff(root, passport, model.passportUrl);
}

/**
 * The passport card element currently on screen (for PNG export).
 * @param {HTMLElement} root
 * @returns {HTMLElement}
 */
export function getPassportElement(root) {
  return query('[data-passport-mount] .passport', root);
}
