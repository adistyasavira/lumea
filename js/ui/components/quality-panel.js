/**
 * LUMÉA — Live lighting and framing indicators next to the camera.
 */
import { createElement, replaceChildren } from '../dom.js';

const STATUS_GLYPHS = Object.freeze({ good: '✓', warn: '!', bad: '×' });
const STATUS_WORDS = Object.freeze({ good: 'baik', warn: 'perhatian', bad: 'perlu diperbaiki' });

/**
 * One indicator row.
 * @param {{id:string, status:string, label:string, message:string}} check
 * @returns {HTMLElement}
 */
function createCheckRow(check) {
  return createElement('li', { className: `quality__item quality__item--${check.status}`, dataset: { check: check.id } }, [
    createElement('span', { className: 'quality__glyph', text: STATUS_GLYPHS[check.status], attrs: { 'aria-hidden': 'true' } }),
    createElement('span', { className: 'quality__label', text: check.label }),
    createElement('span', { className: 'quality__message', text: check.message }),
    createElement('span', { className: 'visually-hidden', text: `Status ${STATUS_WORDS[check.status]}` }),
  ]);
}

/**
 * Re-renders the indicator list.
 * @param {HTMLElement} listElement
 * @param {ReadonlyArray<object>} checks
 */
export function renderQualityPanel(listElement, checks) {
  replaceChildren(listElement, checks.map(createCheckRow));
}

/**
 * A single message row shown before the first frame arrives.
 * @param {HTMLElement} listElement
 * @param {string} message
 */
export function renderQualityPlaceholder(listElement, message) {
  replaceChildren(listElement, [createElement('li', { className: 'quality__item quality__item--idle', text: message })]);
}
