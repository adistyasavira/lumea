/**
 * LUMÉA — Short status messages (aria-live) instead of blocking alert() dialogs.
 */
import { createElement } from '../dom.js';
import { APP_CONFIG } from '../../config/app-config.js';

/**
 * Shows a toast inside the given live region.
 * @param {HTMLElement} region element with aria-live="polite"
 * @param {string} message
 * @param {'info'|'success'|'error'} [tone='info']
 */
export function showToast(region, message, tone = 'info') {
  const toast = createElement('div', { className: `toast toast--${tone}`, attrs: { role: 'status' }, text: message });
  region.append(toast);
  setTimeout(() => toast.remove(), APP_CONFIG.uiTiming.toastMilliseconds);
}
