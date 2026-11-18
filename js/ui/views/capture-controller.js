/**
 * LUMÉA — Camera step: live preview with guide overlay and quality checks,
 * countdown capture, frozen still with draggable zones, retake and upload fallback.
 */
import { CAPTURE_CONFIG } from '../../config/capture-config.js';
import { inspectFrame } from '../../analysis/analysis-pipeline.js';
import { startCamera, stopCamera, isCameraSupported, describeCameraError } from '../../capture/camera-stream.js';
import { createWorkingCanvas, grabFrame, paintStill } from '../../capture/frame-grabber.js';
import { loadImageFile } from '../../capture/image-upload.js';
import { renderGuideOverlay, enableZoneDragging } from '../components/guide-overlay.js';
import { renderQualityPanel, renderQualityPlaceholder } from '../components/quality-panel.js';
import { query, queryAll, setHidden, bindText } from '../dom.js';
import { labToHex } from '../../color/color-convert.js';
import { CAPTURE_MODES } from '../store.js';

const { timing: TIMING } = CAPTURE_CONFIG;
const NO_OFFSET = Object.freeze({ dx: 0, dy: 0 });
const PREVIEW_GLYPHS = Object.freeze({ found: '✓', missing: '○' });
const PREVIEW_EMPTY = '—';

const MODE_COPY = Object.freeze({
  live: {
    title: 'Posisikan wajah di dalam oval',
    hint: 'Mata sejajar garis tipis, wajah memenuhi oval, tanpa kacamata. Tombol aktif saat semua indikator baik.',
  },
  still: {
    title: 'Cek titik sampel',
    hint: 'Geser kotak dahi, pipi, atau alis bila tertutup poni, kacamata, atau hijab. Lalu tekan Analisis.',
  },
});

/** Controls the capture step of the booth. */
export class CaptureController {
  /**
   * @param {{root:HTMLElement, store:object, notify:(message:string, tone?:string)=>void}} deps
   */
  constructor({ root, store, notify }) {
    this.root = root;
    this.store = store;
    this.notify = notify;
    this.elements = CaptureController.collectElements(root);
    this.working = createWorkingCanvas();
    this.camera = null;
    this.cameraRequestId = 0;
    this.loopTimer = null;
    this.countdownTimer = null;
    enableZoneDragging(this.elements.overlay, {
      getOffset: (zoneId) => this.store.getState().zoneOffsets[zoneId] ?? NO_OFFSET,
      onChange: (zoneId, offset) => this.moveZone(zoneId, offset),
    });
  }

  /** Elements of the capture step. */
  static collectElements(root) {
    return {
      stage: query('[data-stage]', root),
      video: query('[data-camera]', root),
      still: query('[data-still]', root),
      overlay: query('[data-overlay]', root),
      countdown: query('[data-countdown]', root),
      quality: query('[data-quality]', root),
      liveActions: query('[data-live-actions]', root),
      reviewActions: query('[data-review-actions]', root),
      captureButton: query('[data-action="capture"]', root),
    };
  }

  /** Current analysis options from the session. */
  frameOptions() {
    const state = this.store.getState();
    return { offsets: state.zoneOffsets, useReference: state.useReference };
  }

  /** The still canvas (used by the drape panels). */
  getStillCanvas() {
    return this.elements.still;
  }

  /** Opens the camera and starts the live loop. */
  async start() {
    this.applyMode(CAPTURE_MODES.live);
    this.renderPreview(null);
    this.elements.captureButton.disabled = true;
    renderQualityPlaceholder(this.elements.quality, 'Menyalakan kamera…');
    if (!isCameraSupported()) {
      renderQualityPlaceholder(this.elements.quality, 'Browser ini tidak mendukung kamera. Gunakan Upload foto.');
      return;
    }
    this.stop();
    const requestId = ++this.cameraRequestId;
    try {
      const camera = await startCamera(this.elements.video);
      if (requestId !== this.cameraRequestId) {
        stopCamera(camera, this.elements.video);
        return;
      }
      this.camera = camera;
      if (this.store.getState().captureMode === CAPTURE_MODES.live) this.startLoop();
    } catch (error) {
      if (requestId === this.cameraRequestId) renderQualityPlaceholder(this.elements.quality, describeCameraError(error));
    }
  }

  /** Stops camera, loop and countdown; wipes the still canvas. */
  stop() {
    this.cameraRequestId += 1;
    this.stopLoop();
    clearInterval(this.countdownTimer);
    stopCamera(this.camera, this.elements.video);
    this.camera = null;
    const { still } = this.elements;
    still.getContext('2d').clearRect(0, 0, still.width, still.height);
  }

  startLoop() {
    this.stopLoop();
    this.loopTimer = setInterval(() => this.inspectLiveFrame(), TIMING.liveCheckIntervalMilliseconds);
  }

  stopLoop() {
    clearInterval(this.loopTimer);
    this.loopTimer = null;
  }

  /** One live-loop tick: grab, inspect, draw. */
  inspectLiveFrame() {
    const imageData = grabFrame(this.elements.video, this.working, { mirror: true });
    if (!imageData) return;
    const inspection = inspectFrame(imageData, this.frameOptions());
    this.showInspection(imageData, inspection, false);
    this.elements.captureButton.disabled = !inspection.quality.isReady;
  }

  /** Draws overlay and indicators. */
  showInspection(imageData, inspection, interactive) {
    this.elements.stage.style.setProperty('--stage-aspect', `${imageData.width} / ${imageData.height}`);
    renderGuideOverlay(this.elements.overlay, {
      frame: imageData,
      oval: inspection.oval,
      rects: inspection.rects,
      interactive,
      showReference: this.frameOptions().useReference,
    });
    renderQualityPanel(this.elements.quality, inspection.quality.checks);
    this.renderPreview(inspection.preview);
  }

  /**
   * Skin, brow and hair cards with the colour currently read from each zone.
   * @param {{skin:object|null, brow:object|null, hair:object|null}} preview
   */
  renderPreview(preview) {
    queryAll('[data-preview]', this.root).forEach((card) => {
      const lab = preview?.[card.dataset.preview] ?? null;
      const hex = lab ? labToHex(lab) : null;
      query('[data-preview-chip]', card).style.setProperty('--swatch', hex ?? 'transparent');
      query('[data-preview-hex]', card).textContent = hex ?? PREVIEW_EMPTY;
      query('[data-preview-status]', card).textContent = hex ? PREVIEW_GLYPHS.found : PREVIEW_GLYPHS.missing;
      card.classList.toggle('is-found', Boolean(hex));
    });
  }

  /** Shows the right layer, actions and copy for a mode. */
  applyMode(mode) {
    const isStill = mode === CAPTURE_MODES.still;
    const { video, still, countdown, liveActions, reviewActions } = this.elements;
    setHidden(video, isStill);
    setHidden(still, !isStill);
    setHidden(countdown, mode !== CAPTURE_MODES.countdown);
    setHidden(liveActions, isStill);
    setHidden(reviewActions, !isStill);
    const copy = isStill ? MODE_COPY.still : MODE_COPY.live;
    bindText(this.root, 'capture-title', copy.title);
    bindText(this.root, 'capture-hint', copy.hint);
    this.store.setState({ captureMode: mode });
  }

  /** Countdown, then freeze the current frame. */
  capture() {
    if (this.store.getState().captureMode !== CAPTURE_MODES.live || !this.camera) return;
    let remaining = TIMING.countdownSeconds;
    this.applyMode(CAPTURE_MODES.countdown);
    this.elements.countdown.textContent = String(remaining);
    this.countdownTimer = setInterval(() => {
      remaining -= 1;
      this.elements.countdown.textContent = String(remaining);
      if (remaining > 0) return;
      clearInterval(this.countdownTimer);
      this.freezeCurrentFrame();
    }, TIMING.countdownTickMilliseconds);
  }

  /** Freezes the current video frame immediately (operator override). */
  freezeCurrentFrame() {
    const imageData = grabFrame(this.elements.video, this.working, { mirror: true });
    if (imageData) this.freeze(imageData);
  }

  /** Shows a still for review and stores its pixels in the session. */
  freeze(imageData) {
    this.stopLoop();
    paintStill(this.elements.still, imageData);
    const inspection = inspectFrame(imageData, this.frameOptions());
    this.store.setState({ still: imageData, stillWasReady: inspection.quality.isReady });
    this.applyMode(CAPTURE_MODES.still);
    this.showInspection(imageData, inspection, true);
  }

  /** Back to live preview with zones reset. */
  retake() {
    this.store.setState({ still: null, zoneOffsets: {} });
    this.applyMode(CAPTURE_MODES.live);
    this.elements.captureButton.disabled = true;
    if (this.camera) this.startLoop();
    else this.start();
  }

  /** Upload fallback. */
  async upload(file) {
    try {
      const bitmap = await loadImageFile(file);
      this.stopLoop();
      this.freeze(grabFrame(bitmap, this.working, { mirror: false }));
      bitmap.close();
    } catch (error) {
      this.notify(error.message, 'error');
    }
  }

  /** Applies a dragged zone offset and re-inspects the still. */
  moveZone(zoneId, offset) {
    const state = this.store.getState();
    this.store.setState({ zoneOffsets: { ...state.zoneOffsets, [zoneId]: offset } });
    const inspection = inspectFrame(state.still, this.frameOptions());
    this.showInspection(state.still, inspection, true);
  }
}
