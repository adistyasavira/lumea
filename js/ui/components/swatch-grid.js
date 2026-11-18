/**
 * LUMÉA — Swatch lists used by the result screen, passport card and Journal.
 */
import { createElement } from '../dom.js';

/**
 * One swatch: colour chip, name and hex code.
 * @param {{name:string, hex:string}} swatch
 * @param {{showName?:boolean, showHex?:boolean, isAvoid?:boolean}} options
 * @returns {HTMLElement}
 */
export function createSwatch(swatch, options = {}) {
  const chipClass = options.isAvoid ? 'swatch__chip swatch__chip--avoid' : 'swatch__chip';
  return createElement('li', { className: 'swatch' }, [
    createElement('span', { className: chipClass, vars: { swatch: swatch.hex }, attrs: { 'aria-hidden': 'true' } }, [
      options.isAvoid ? createElement('span', { className: 'swatch__strike' }) : null,
    ]),
    options.showName === false ? null : createElement('span', { className: 'swatch__name', text: swatch.name }),
    options.showHex === false ? null : createElement('span', { className: 'swatch__hex mono', text: swatch.hex }),
  ]);
}

/**
 * A list of swatches.
 * @param {ReadonlyArray<{name:string, hex:string}>} swatches
 * @param {{className?:string, label?:string, showName?:boolean, showHex?:boolean, isAvoid?:boolean}} [options]
 * @returns {HTMLUListElement}
 */
export function createSwatchGrid(swatches, options = {}) {
  const list = createElement('ul', {
    className: ['swatch-grid', options.className].filter(Boolean).join(' '),
    attrs: options.label ? { 'aria-label': options.label } : {},
  });
  list.append(...swatches.map((swatch) => createSwatch(swatch, options)));
  return list;
}

/**
 * A horizontal colour strip (outfit formulas, article covers).
 * @param {ReadonlyArray<string>} hexes
 * @param {string} label accessible description
 * @returns {HTMLElement}
 */
export function createColorStrip(hexes, label) {
  const strip = createElement('div', { className: 'color-strip', attrs: { role: 'img', 'aria-label': label } });
  strip.append(...hexes.map((hex) => createElement('span', { className: 'color-strip__band', vars: { swatch: hex } })));
  return strip;
}
