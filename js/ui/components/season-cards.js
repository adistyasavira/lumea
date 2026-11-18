/**
 * LUMÉA — Season cards: the small four-colour cards on the home page and the
 * sub-season cards on The Palettes page.
 */
import { createElement } from '../dom.js';
import { buildHash } from '../router.js';

/** Palette positions shown on the small home card (a light, a mid, a deep and an accent tone). */
const MINI_CARD_INDICES = Object.freeze([0, 1, 5, 6]);
/** Colours shown in the sub-season bar on The Palettes page. */
const BAR_SIZE = 6;
/** Names listed per category on a sub-season card. */
const CLOTHING_NAMES = 4;
const SPEC_SEPARATOR = ', ';

/**
 * Small square colour block.
 * @param {string} hex
 * @param {string} className
 * @returns {HTMLElement}
 */
function createColorBox(hex, className) {
  return createElement('span', { className, vars: { swatch: hex } });
}

/**
 * Home page card: four colours and the season name, linking to The Palettes.
 * @param {object} season
 * @returns {HTMLElement}
 */
export function createMiniSeasonCard(season) {
  const boxes = MINI_CARD_INDICES.map((index) => createColorBox(season.palette[index].hex, 'color-box'));
  return createElement('a', { className: 'swatch-card', attrs: { href: buildHash('palettes'), 'aria-label': `${season.name} palette` } }, [
    createElement('span', { className: 'swatch-block-grid', attrs: { 'aria-hidden': 'true' } }, boxes),
    createElement('span', { className: 'swatch-card-label', text: season.name }),
  ]);
}

/**
 * Horizontal swatch bar with colour names as tooltips.
 * @param {ReadonlyArray<{name:string, hex:string}>} swatches
 * @param {string} label accessible description
 * @returns {HTMLElement}
 */
export function createSwatchBar(swatches, label) {
  const items = swatches.map((swatch) => createElement('span', { className: 'bar-item', vars: { swatch: swatch.hex }, attrs: { title: `${swatch.name} ${swatch.hex}` } }));
  return createElement('div', { className: 'season-swatch-bar', attrs: { role: 'img', 'aria-label': label } }, items);
}

/**
 * One "CLOTHING / MAKEUP / METALS" block.
 * @param {string} title
 * @param {string} text
 * @returns {HTMLElement}
 */
function createSpec(title, text) {
  return createElement('div', { className: 'spec-category' }, [
    createElement('h5', { text: title }),
    createElement('p', { text }),
  ]);
}

/**
 * Sub-season card on The Palettes page.
 * @param {object} season
 * @returns {HTMLElement}
 */
export function createSubSeasonCard(season) {
  const swatches = season.palette.slice(0, BAR_SIZE);
  const clothing = season.palette.slice(0, CLOTHING_NAMES).map((swatch) => swatch.name).join(SPEC_SEPARATOR);
  const makeup = [...season.makeup.blush.slice(0, 1), ...season.makeup.lip].map((swatch) => swatch.name).join(SPEC_SEPARATOR);
  return createElement('article', { className: 'subseason-card', attrs: { id: `season-${season.id}` } }, [
    createSwatchBar(swatches, `${season.name}: ${swatches.map((swatch) => swatch.name).join(SPEC_SEPARATOR)}`),
    createElement('h3', { className: 'subseason-card__name', text: season.name }),
    createElement('p', { className: 'subseason-card__tagline', text: season.tagline }),
    createElement('p', { className: 'subseason-card__description', text: season.description }),
    createElement('div', { className: 'season-specs-grid season-specs-grid--stacked' }, [
      createSpec('Clothing', clothing),
      createSpec('Makeup', makeup),
      createSpec('Metals', season.metals.join(SPEC_SEPARATOR)),
    ]),
  ]);
}
