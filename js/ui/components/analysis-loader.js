/**
 * LUMÉA — Full-screen "Reading your colors…" overlay with pulsing swatches, shown
 * briefly while the result is prepared.
 */
import { query } from '../dom.js';

const ACTIVE_CLASS = 'active';

/**
 * Shows the overlay, steps through the messages, then hides it.
 * @param {HTMLElement} overlay element with a [data-loader-text] child
 * @param {ReadonlyArray<string>} messages
 * @param {number} stepMilliseconds time per message
 * @returns {Promise<void>} resolves when the overlay is hidden again
 */
export function playAnalysisLoader(overlay, messages, stepMilliseconds) {
  const text = query('[data-loader-text]', overlay);
  overlay.classList.add(ACTIVE_CLASS);
  overlay.setAttribute('aria-hidden', 'false');
  return new Promise((resolve) => {
    let index = 0;
    text.textContent = messages[index];
    const timer = setInterval(() => {
      index += 1;
      if (index < messages.length) {
        text.textContent = messages[index];
        return;
      }
      clearInterval(timer);
      overlay.classList.remove(ACTIVE_CLASS);
      overlay.setAttribute('aria-hidden', 'true');
      resolve();
    }, stepMilliseconds);
  });
}
