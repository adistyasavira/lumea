/**
 * LUMÉA — Admin PIN modal that turns on booth mode. Opened by tapping the LUMÉA
 * logo several times in a row, or by opening #recap directly. The operator also
 * picks which booth laptop this browser is.
 */
import { APP_CONFIG } from '../../config/app-config.js';
import { verifyPin, enableBoothMode, getBoothDevice } from '../../admin/booth-mode.js';
import { query, delegate, replaceChildren, createElement, setHidden } from '../dom.js';

const { admin: ADMIN } = APP_CONFIG;
const MILLISECONDS_PER_SECOND = 1000;

/** Controls the PIN modal and the logo tap counter. */
export class AdminGate {
  /**
   * @param {{modal:HTMLElement, logo:HTMLElement, onUnlocked:()=>void, onCancelled:()=>void}} deps
   */
  constructor({ modal, logo, onUnlocked, onCancelled }) {
    this.modal = modal;
    this.form = query('[data-form="admin-pin"]', modal);
    this.onUnlocked = onUnlocked;
    this.onCancelled = onCancelled;
    this.failedAttempts = 0;
    this.lockedUntil = 0;
    this.taps = [];
    this.renderDeviceOptions();
    logo.addEventListener('click', () => this.countLogoTap());
    delegate(modal, 'click', '[data-action="close-admin"]', () => this.cancel());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.cancel();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) this.cancel();
    });
    this.form.addEventListener('submit', (event) => this.onSubmit(event));
  }

  /** Laptop choices from the config. */
  renderDeviceOptions() {
    const options = ADMIN.devices.map((device) => createElement('option', { text: device.label, attrs: { value: device.code } }));
    replaceChildren(query('[name="device"]', this.form), options);
  }

  /** Opens the modal after enough quick taps on the logo. */
  countLogoTap() {
    const now = Date.now();
    this.taps = [...this.taps.filter((time) => now - time < ADMIN.logoTapWindowMilliseconds), now];
    if (this.taps.length < ADMIN.logoTapCount) return;
    this.taps = [];
    if (getBoothDevice()) this.onUnlocked();
    else this.open();
  }

  /** Shows the modal (no-op while already open). */
  open() {
    if (!this.modal.hidden) return;
    this.form.reset();
    this.showError('');
    this.modal.hidden = false;
    document.body.classList.add('has-modal');
    query('[name="pin"]', this.form).focus();
  }

  close() {
    this.modal.hidden = true;
    document.body.classList.remove('has-modal');
  }

  cancel() {
    this.close();
    this.onCancelled();
  }

  showError(message) {
    const slot = query('[data-admin-error]', this.form);
    slot.textContent = message;
    setHidden(slot, !message);
  }

  /** Checks the PIN, with a short lockout after repeated wrong attempts. */
  onSubmit(event) {
    event.preventDefault();
    const remaining = this.lockedUntil - Date.now();
    if (remaining > 0) {
      this.showError(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(remaining / MILLISECONDS_PER_SECOND)} detik.`);
      return;
    }
    const data = new FormData(this.form);
    if (!verifyPin(String(data.get('pin') ?? ''))) {
      this.registerFailure();
      return;
    }
    this.failedAttempts = 0;
    if (!enableBoothMode(String(data.get('device')))) {
      this.showError('Browser ini memblokir penyimpanan lokal, jadi Mode Booth tidak bisa disimpan.');
      return;
    }
    this.close();
    this.onUnlocked();
  }

  registerFailure() {
    this.failedAttempts += 1;
    query('[name="pin"]', this.form).value = '';
    if (this.failedAttempts >= ADMIN.maxPinAttempts) {
      this.failedAttempts = 0;
      this.lockedUntil = Date.now() + ADMIN.lockoutMilliseconds;
      this.showError(`PIN salah ${ADMIN.maxPinAttempts} kali. Form dikunci ${ADMIN.lockoutMilliseconds / MILLISECONDS_PER_SECOND} detik.`);
      return;
    }
    this.showError('PIN salah. Coba lagi.');
  }
}
