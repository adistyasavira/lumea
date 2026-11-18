/**
 * LUMÉA — Consultations: the booth flow in three steps (01 Photo → 02 Your colors →
 * 03 Your palette), then the next customer. Owns step switching, the progress bar,
 * actions and the operator keyboard shortcuts. Sessions are counted only in booth mode.
 */
import { APP_CONFIG } from '../../config/app-config.js';
import { analyzeFrame } from '../../analysis/analysis-pipeline.js';
import { AnalysisError } from '../../analysis/feature-extractor.js';
import { buildPassportRecord, expandPassport, toIsoDate } from '../../passport/passport-model.js';
import { buildPassportUrl } from '../../passport/passport-link.js';
import { renderToPng, shareOrDownload, buildFileName } from '../../passport/passport-export.js';
import { CONSULTATION_STEPS, CAPTURE_MODES, createInitialSession } from '../store.js';
import { query, queryAll, delegate, setHidden } from '../dom.js';
import { loadBoothSettings, saveBoothSettings } from '../booth-settings.js';
import { getBoothDevice } from '../../admin/booth-mode.js';
import { createSessionEntry } from '../../recap/session-entry.js';
import { recordBoothSession } from '../../recap/session-repository.js';
import { findPackage } from '../../recap/pricing.js';
import { formatRupiah } from '../../recap/recap-summary.js';
import { nextDeviceSequence, nextPublicSequence } from '../../recap/local-session-store.js';
import { playAnalysisLoader } from '../components/analysis-loader.js';
import { CaptureController } from './capture-controller.js';
import { renderResult, getPassportElement } from './result-view.js';

const { shortcuts: SHORTCUTS, uiTiming: UI_TIMING, admin: ADMIN, booth: BOOTH } = APP_CONFIG;
const STEP_ORDER = Object.freeze([CONSULTATION_STEPS.photo, CONSULTATION_STEPS.colors, CONSULTATION_STEPS.palette]);
const LOADER_MESSAGES = Object.freeze(['Reading your colors…', 'Comparing warmth, depth, and clarity…', 'Creating your Luméa palette…']);
const CONSENT_MESSAGE = 'Centang persetujuan customer dulu sebelum memotret atau mengunggah foto.';

/** Controls the Consultations view. */
export class ConsultationView {
  /**
   * @param {{root:HTMLElement, loader:HTMLElement, store:object, notify:(message:string, tone?:string)=>void, onSessionRecorded:()=>void}} deps
   */
  constructor({ root, loader, store, notify, onSessionRecorded }) {
    this.root = root;
    this.loader = loader;
    this.store = store;
    this.notify = notify;
    this.onSessionRecorded = onSessionRecorded;
    this.isActive = false;
    this.isAnalyzing = false;
    this.isBundlePartnerNext = false;
    this.form = query('[data-form="intake"]', root);
    this.capture = new CaptureController({ root: query('[data-step="colors"]', root), store, notify });
    this.store.subscribe((state, previous) => {
      if (state.step !== previous.step) this.showStep(state.step);
    });
    this.bindActions();
    this.bindIntake();
    document.addEventListener('keydown', (event) => this.handleShortcut(event));
    this.form.elements.namedItem('reference').checked = loadBoothSettings().useReference;
    this.showStep(store.getState().step);
  }

  /** Called by the router. */
  show() {
    this.isActive = true;
    const { step, captureMode } = this.store.getState();
    if (step === CONSULTATION_STEPS.colors && captureMode !== CAPTURE_MODES.still) this.capture.start();
  }

  /** Called by the router when leaving: the camera must never stay on in the background. */
  hide() {
    this.isActive = false;
    this.capture.stop();
  }

  /** Toggles the visible pane and the progress bar. */
  showStep(step) {
    queryAll('[data-step]', this.root).forEach((pane) => setHidden(pane, pane.dataset.step !== step));
    const currentIndex = STEP_ORDER.indexOf(step);
    queryAll('[data-progress]', this.root).forEach((item) => {
      const index = STEP_ORDER.indexOf(item.dataset.progress);
      item.classList.toggle('active', index === currentIndex);
      item.classList.toggle('completed', index < currentIndex);
      if (index === currentIndex) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  /** One delegated click handler for every data-action button. */
  bindActions() {
    const actions = {
      capture: () => this.capture.capture(),
      'force-capture': () => this.capture.freezeCurrentFrame(),
      retake: () => this.capture.retake(),
      analyze: () => this.analyze(),
      'cancel-session': () => this.resetSession(),
      'download-passport': () => this.exportPassport(),
      'next-session': () => this.resetSession(),
    };
    delegate(this.root, 'click', '[data-action]', (event, target) => {
      const action = actions[target.dataset.action];
      if (!action) return;
      event.preventDefault();
      action();
    });
    delegate(this.root, 'change', '[data-upload]', (event, target) => {
      const file = target.files?.[0];
      target.value = '';
      if (file) this.uploadPhoto(file);
    });
  }

  /** Intake form submit, consent check and drag-and-drop on the dropzone. */
  bindIntake() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.saveIntake()) this.openCamera();
    });
    const dropzone = query('[data-dropzone]', this.root);
    dropzone.addEventListener('click', (event) => {
      if (!this.hasConsent()) {
        event.preventDefault();
        this.showIntakeError(CONSENT_MESSAGE);
      }
    });
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
      const file = event.dataTransfer?.files?.[0];
      if (file) this.uploadPhoto(file);
    });
  }

  hasConsent() {
    return this.form.elements.namedItem('consent').checked;
  }

  /** Shows or clears the message under the intake form. */
  showIntakeError(message) {
    const slot = query('[data-intake-error]', this.root);
    slot.textContent = message;
    setHidden(slot, !message);
  }

  /**
   * Stores nickname and options in the session.
   * @returns {boolean} false when consent is missing
   */
  saveIntake() {
    if (!this.hasConsent()) {
      this.showIntakeError(CONSENT_MESSAGE);
      return false;
    }
    this.showIntakeError('');
    const data = new FormData(this.form);
    const useReference = data.get('reference') === 'on';
    saveBoothSettings({ useReference });
    this.store.setState({
      nickname: String(data.get('nickname') ?? '').trim().slice(0, APP_CONFIG.booth.nicknameMaxLength),
      hasMakeup: data.get('makeup') === 'on',
      packageCode: data.get('bundle') === 'on' ? BOOTH.packages.bundle.code : BOOTH.packages.solo.code,
      useReference,
    });
    return true;
  }

  openCamera() {
    this.store.setState({ step: CONSULTATION_STEPS.colors });
    this.capture.start();
  }

  /** Upload from step 01 (after consent) or from the camera panel. */
  uploadPhoto(file) {
    const isOnPhotoStep = this.store.getState().step === CONSULTATION_STEPS.photo;
    if (isOnPhotoStep && !this.saveIntake()) return;
    this.capture.stop();
    this.store.setState({ step: CONSULTATION_STEPS.colors });
    this.capture.upload(file);
  }

  /** Runs the analysis on the frozen still, with the short loader animation. */
  async analyze() {
    const state = this.store.getState();
    if (!state.still || this.isAnalyzing) return;
    try {
      const analysis = analyzeFrame(state.still, { offsets: state.zoneOffsets, useReference: state.useReference, hasMakeup: state.hasMakeup });
      this.isAnalyzing = true;
      await playAnalysisLoader(this.loader, LOADER_MESSAGES, UI_TIMING.analysisStepMilliseconds);
      this.showResult(analysis, state);
    } catch (error) {
      if (!(error instanceof AnalysisError)) throw error;
      this.notify(error.message, 'error');
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Builds the passport and renders step 03. Only booth-mode analyses are recorded in
   * the recap; a visitor's own phone gets the same result without being counted.
   */
  showResult(analysis, state) {
    const device = getBoothDevice();
    const isoDate = toIsoDate(new Date());
    const record = buildPassportRecord(analysis, {
      nickname: state.nickname,
      isoDate,
      sequence: device ? nextDeviceSequence(device.code, isoDate) : nextPublicSequence(isoDate),
      deviceCode: device ? device.code : ADMIN.publicDeviceCode,
    });
    renderResult(query('[data-step="palette"]', this.root), {
      passport: expandPassport(record),
      oval: analysis.oval,
      stillCanvas: this.capture.getStillCanvas(),
      passportUrl: buildPassportUrl(record),
      wasReady: state.stillWasReady,
    });
    this.capture.stop();
    this.store.setState({ analysis, passportRecord: record, step: CONSULTATION_STEPS.palette });
    this.showRecordNote(device ? `Mencatat sesi di rekap ${device.label}…` : '');
    if (device) this.recordSession(record, device, state.packageCode);
    window.scrollTo({ top: 0 });
  }

  /**
   * Saves the booth session (locally first, then Supabase) and reports where it went.
   * After the first person of a Bundle Duo, the bundle box is pre-ticked for the partner.
   */
  async recordSession(record, device, packageCode) {
    const isBundle = packageCode === BOOTH.packages.bundle.code;
    this.isBundlePartnerNext = isBundle && !this.isBundlePartnerNext;
    const entry = createSessionEntry(record, device, packageCode);
    const priceText = `${findPackage(packageCode).shortLabel} ${formatRupiah(entry.price)}`;
    const { synced } = await recordBoothSession(entry);
    this.showRecordNote(synced
      ? `Tercatat di Rekapan Hari Ini (${device.label}, ${priceText}, tersinkron).`
      : `Tercatat di ${device.label} (${priceText}). Akan dikirim ke rekap bersama saat online.`);
    this.onSessionRecorded();
  }

  /** Booth-only line under the passport actions. */
  showRecordNote(message) {
    const note = query('[data-record-note]', this.root);
    note.textContent = message;
    setHidden(note, !message);
  }

  /** Exports the passport card as PNG. */
  async exportPassport() {
    const record = this.store.getState().passportRecord;
    if (!record) return;
    try {
      const blob = await renderToPng(getPassportElement(this.root));
      await shareOrDownload(blob, buildFileName(record.id), 'Digital Color Passport LUMÉA');
      this.notify('Passport tersimpan.', 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') this.notify(error.message, 'error');
    }
  }

  /** Wipes the customer (photo included) and returns to step 01. */
  resetSession() {
    this.capture.stop();
    const { useReference } = loadBoothSettings();
    this.form.reset();
    this.form.elements.namedItem('reference').checked = useReference;
    this.form.elements.namedItem('bundle').checked = this.isBundlePartnerNext;
    this.showIntakeError('');
    this.store.setState({ ...createInitialSession(), useReference });
    window.scrollTo({ top: 0 });
  }

  /** Operator keyboard shortcuts (ignored while typing in a field). */
  handleShortcut(event) {
    const isTyping = event.target instanceof HTMLElement && event.target.closest('input, textarea, select');
    if (!this.isActive || isTyping || event.metaKey || event.ctrlKey) return;
    const handler = this.shortcutHandler(event.key.toLowerCase());
    if (!handler) return;
    event.preventDefault();
    handler();
  }

  /** Resolves a key to an action for the current step. */
  shortcutHandler(key) {
    const { step, captureMode } = this.store.getState();
    const isStill = captureMode === CAPTURE_MODES.still;
    const isCapturing = step === CONSULTATION_STEPS.colors;
    if (isCapturing && key === SHORTCUTS.capture && !isStill) return () => this.capture.capture();
    if (isCapturing && key === SHORTCUTS.retake && isStill) return () => this.capture.retake();
    if (isCapturing && key === SHORTCUTS.analyze && isStill) return () => this.analyze();
    if (step === CONSULTATION_STEPS.palette && key === SHORTCUTS.nextSession) return () => this.resetSession();
    return null;
  }
}
