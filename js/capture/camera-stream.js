/**
 * LUMÉA — Camera stream lifecycle (getUserMedia). Locks white balance and exposure
 * after a settle period when the browser and camera allow it.
 */
import { CAPTURE_CONFIG } from '../config/capture-config.js';

const LOCKABLE_MODES = Object.freeze(['whiteBalanceMode', 'exposureMode']);
const MANUAL_MODE = 'manual';

/**
 * Whether this browser can open a camera (requires HTTPS or localhost).
 * @returns {boolean}
 */
export function isCameraSupported() {
  return Boolean(globalThis.navigator?.mediaDevices?.getUserMedia) && globalThis.isSecureContext !== false;
}

/**
 * Builds the getUserMedia constraints from configuration.
 * @returns {MediaStreamConstraints}
 */
function buildConstraints() {
  const { facingMode, idealWidth, idealHeight } = CAPTURE_CONFIG.camera;
  return {
    audio: false,
    video: { facingMode, width: { ideal: idealWidth }, height: { ideal: idealHeight } },
  };
}

/**
 * Locks auto white balance and exposure where the track supports manual modes.
 * Failures are ignored on purpose: many webcams do not expose these controls.
 * @param {MediaStreamTrack} track
 */
async function lockAutoSettings(track) {
  const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
  const advanced = LOCKABLE_MODES
    .filter((mode) => Array.isArray(capabilities[mode]) && capabilities[mode].includes(MANUAL_MODE))
    .map((mode) => ({ [mode]: MANUAL_MODE }));
  if (advanced.length === 0) return;
  try {
    await track.applyConstraints({ advanced });
  } catch {
    // Unsupported on this device; the grey card correction still applies.
  }
}

/**
 * Opens the camera into a <video> element and schedules the auto-settings lock.
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<{stream: MediaStream, cancelLock: () => void}>}
 */
export async function startCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia(buildConstraints());
  videoElement.srcObject = stream;
  await videoElement.play();
  const [track] = stream.getVideoTracks();
  const lockTimer = setTimeout(() => lockAutoSettings(track), CAPTURE_CONFIG.camera.settleMilliseconds);
  return { stream, cancelLock: () => clearTimeout(lockTimer) };
}

/**
 * Stops every track of a stream and detaches it from the video element.
 * @param {{stream: MediaStream, cancelLock: () => void}|null} camera
 * @param {HTMLVideoElement} videoElement
 */
export function stopCamera(camera, videoElement) {
  if (!camera) return;
  camera.cancelLock();
  camera.stream.getTracks().forEach((track) => track.stop());
  videoElement.srcObject = null;
}

/**
 * Turns a getUserMedia error into an operator message (Indonesian).
 * @param {Error} error
 * @returns {string}
 */
export function describeCameraError(error) {
  const messages = {
    NotAllowedError: 'Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi.',
    NotFoundError: 'Kamera tidak ditemukan. Sambungkan kamera atau gunakan Upload foto.',
    NotReadableError: 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.',
  };
  return messages[error?.name] ?? 'Kamera tidak bisa dibuka. Gunakan Upload foto sebagai cadangan.';
}
