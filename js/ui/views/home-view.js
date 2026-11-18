/**
 * LUMÉA — Home: hero colour wheel and the 12 season cards under "Unlock your true hue".
 */
import { SEASONS } from '../../data/seasons.js';
import { query, replaceChildren } from '../dom.js';
import { createColorWheel } from '../components/color-wheel.js';
import { createMiniSeasonCard } from '../components/season-cards.js';

/** Controls the home view (static content, rendered once). */
export class HomeView {
  /**
   * @param {{root:HTMLElement}} deps
   */
  constructor({ root }) {
    replaceChildren(query('[data-color-wheel]', root), [createColorWheel()]);
    replaceChildren(query('[data-home-seasons]', root), SEASONS.map(createMiniSeasonCard));
  }

  show() {}

  hide() {}
}
