/**
 * LUMÉA — Book Now modal and the home page newsletter form. Both send to the
 * owner's email through the static form service configured in app-config.js.
 */
import { APP_CONFIG } from '../../config/app-config.js';
import { validateBooking, validateNewsletter } from '../../booking/booking-validation.js';
import { sendForm } from '../../booking/form-transport.js';
import { toIsoDate } from '../../passport/passport-model.js';
import { query, delegate, replaceChildren, createElement } from '../dom.js';
import { submitWithFeedback, showFieldErrors, showFormStatus } from '../components/form-feedback.js';

const { booking: BOOKING } = APP_CONFIG;
const BOOKING_SUCCESS = 'Terima kasih! Permintaan booking sudah terkirim. Kami akan menghubungimu untuk konfirmasi jadwal.';
const NEWSLETTER_SUCCESS = 'Terima kasih! Email kamu sudah terdaftar.';

/**
 * Trimmed text values of a form.
 * @param {HTMLFormElement} form
 * @param {string[]} names
 * @returns {Record<string,string>}
 */
function readFields(form, names) {
  const data = new FormData(form);
  return Object.fromEntries(names.map((name) => [name, String(data.get(name) ?? '').trim()]));
}

/** Controls the booking modal and the newsletter form. */
export class BookingView {
  /**
   * @param {{modal:HTMLElement, newsletterRoot:HTMLElement}} deps
   */
  constructor({ modal, newsletterRoot }) {
    this.modal = modal;
    this.form = query('[data-form="booking"]', modal);
    this.newsletterRoot = newsletterRoot;
    this.returnFocus = null;
    this.fillTypeOptions();
    delegate(document, 'click', '[data-action="open-booking"]', (event) => {
      event.preventDefault();
      this.open();
    });
    delegate(modal, 'click', '[data-action="close-booking"]', () => this.close());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) this.close();
    });
    this.form.addEventListener('submit', (event) => this.onBookingSubmit(event));
    query('[data-form="newsletter"]', newsletterRoot).addEventListener('submit', (event) => this.onNewsletterSubmit(event));
  }

  /** Consultation types from the config. */
  fillTypeOptions() {
    const options = BOOKING.consultationTypes.map((type) => createElement('option', { text: type, attrs: { value: type } }));
    replaceChildren(query('[data-booking-types]', this.form), options);
  }

  open() {
    this.returnFocus = document.activeElement;
    query('[data-booking-date]', this.form).min = toIsoDate(new Date());
    this.resetFeedback();
    this.modal.hidden = false;
    document.body.classList.add('has-modal');
    query('[name="name"]', this.form).focus();
  }

  close() {
    this.modal.hidden = true;
    document.body.classList.remove('has-modal');
    if (this.returnFocus instanceof HTMLElement) this.returnFocus.focus();
  }

  /** Booking submit: validate, send, report. */
  async onBookingSubmit(event) {
    event.preventDefault();
    if (this.form.elements.namedItem('botcheck').checked) return;
    const fields = readFields(this.form, ['name', 'email', 'phone', 'type', 'date', 'message']);
    const isSent = await submitWithFeedback(this.form, {
      errors: validateBooking(fields, toIsoDate(new Date())),
      send: () => sendForm(BOOKING.bookingSubject, {
        name: fields.name,
        email: fields.email,
        whatsapp: fields.phone,
        consultation_type: fields.type,
        preferred_date: fields.date || '-',
        message: fields.message || '-',
      }),
      successMessage: BOOKING_SUCCESS,
    });
    if (isSent) this.form.reset();
  }

  /** Newsletter submit. */
  async onNewsletterSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = readFields(form, ['email']);
    const isSent = await submitWithFeedback(this.newsletterRoot, {
      errors: validateNewsletter(fields),
      send: () => sendForm(BOOKING.newsletterSubject, { email: fields.email, source: 'Newsletter: The 5 Essential Colors' }),
      successMessage: NEWSLETTER_SUCCESS,
    });
    if (isSent) form.reset();
  }

  /** Clears old messages (used when the modal opens again). */
  resetFeedback() {
    showFieldErrors(this.form, {});
    showFormStatus(this.form, 'info', '');
  }
}
