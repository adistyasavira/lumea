/**
 * LUMÉA — Feedback for forms that send to the email service: field errors,
 * a loading state on the submit button and a success or failure message.
 */
import { query, queryAll } from '../dom.js';

const LOADING_TEXT = 'MENGIRIM…';
const STATUS_TONES = Object.freeze(['success', 'error', 'info']);

/**
 * Shows one message per field (and clears the others).
 * @param {HTMLElement} root element that holds the form and its [data-error-for] slots
 * @param {Record<string,string>} errors field name → message
 */
export function showFieldErrors(root, errors) {
  queryAll('[data-error-for]', root).forEach((slot) => {
    const message = errors[slot.dataset.errorFor] ?? '';
    slot.textContent = message;
    slot.hidden = !message;
    const input = root.querySelector(`[name="${slot.dataset.errorFor}"]`);
    if (input) input.setAttribute('aria-invalid', String(Boolean(message)));
  });
  const firstInvalid = root.querySelector('[aria-invalid="true"]');
  if (firstInvalid) firstInvalid.focus();
}

/**
 * Shows the status line under the form.
 * @param {HTMLElement} root
 * @param {'success'|'error'|'info'} tone
 * @param {string} message empty hides the line
 */
export function showFormStatus(root, tone, message) {
  const status = query('[data-form-status]', root);
  STATUS_TONES.forEach((name) => status.classList.toggle(`form-status--${name}`, name === tone));
  status.textContent = message;
  status.hidden = !message;
}

/**
 * Disables the submit button and swaps its label while a request runs.
 * @param {HTMLElement} root
 * @param {boolean} isSubmitting
 */
export function setSubmitting(root, isSubmitting) {
  const button = query('[data-submit]', root);
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? LOADING_TEXT : button.dataset.label;
  root.setAttribute('aria-busy', String(isSubmitting));
}

/**
 * Validates, sends and reports.
 * @param {HTMLElement} root
 * @param {{errors:Record<string,string>, send:() => Promise<void>, successMessage:string}} submission
 * @returns {Promise<boolean>} true when the message was sent
 */
export async function submitWithFeedback(root, submission) {
  showFieldErrors(root, submission.errors);
  if (Object.keys(submission.errors).length > 0) {
    showFormStatus(root, 'error', 'Periksa lagi isian yang ditandai.');
    return false;
  }
  setSubmitting(root, true);
  showFormStatus(root, 'info', 'Sedang mengirim…');
  try {
    await submission.send();
    showFormStatus(root, 'success', submission.successMessage);
    return true;
  } catch (error) {
    showFormStatus(root, 'error', error.message);
    return false;
  } finally {
    setSubmitting(root, false);
  }
}
