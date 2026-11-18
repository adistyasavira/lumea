/**
 * LUMÉA — The Palettes: the four season families, each with its three
 * sub-seasons (12 in total) built from seasons.js.
 */
import { SEASON_FAMILIES, getSeasonsOfFamily } from '../../data/season-families.js';
import { query, replaceChildren, createElement } from '../dom.js';
import { createSwatchBar, createSubSeasonCard } from '../components/season-cards.js';

/**
 * One family block: description and signature colours, then its sub-season cards.
 * @param {object} family
 * @returns {HTMLElement}
 */
function createFamilyBlock(family) {
  const signature = family.signature.map((hex) => ({ name: family.name, hex }));
  return createElement('section', { className: 'season-family', attrs: { id: `family-${family.name.toLowerCase()}`, 'aria-label': family.name } }, [
    createElement('div', { className: 'season-row' }, [
      createElement('div', {}, [
        createElement('span', { className: 'season-traits-tag', text: family.traits }),
        createElement('h2', { className: 'season-meta-title', text: family.name.toUpperCase() }),
        createElement('p', { text: family.description }),
      ]),
      createSwatchBar(signature, `Warna khas ${family.name}`),
    ]),
    createElement('div', { className: 'subseason-grid' }, getSeasonsOfFamily(family.name).map(createSubSeasonCard)),
  ]);
}

/** Controls The Palettes view (static content, rendered once). */
export class PalettesView {
  /**
   * @param {{root:HTMLElement}} deps
   */
  constructor({ root }) {
    replaceChildren(query('[data-palettes-list]', root), SEASON_FAMILIES.map(createFamilyBlock));
  }

  show() {}

  hide() {}
}
