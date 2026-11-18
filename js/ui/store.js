/**
 * LUMÉA — Central session state with subscribe/notify. One store per page;
 * created in main.js and passed to views (no globals).
 */

/** Consultation steps in order, matching the progress bar: 01 Photo, 02 Your colors, 03 Your palette. */
export const CONSULTATION_STEPS = Object.freeze({ photo: 'photo', colors: 'colors', palette: 'palette' });

/** Capture sub-modes. */
export const CAPTURE_MODES = Object.freeze({ live: 'live', countdown: 'countdown', still: 'still' });

/**
 * A fresh customer session. Photo pixels live only here and are dropped on reset.
 * @returns {object}
 */
export function createInitialSession() {
  return {
    step: CONSULTATION_STEPS.photo,
    nickname: '',
    hasMakeup: false,
    packageCode: null,
    useReference: false,
    captureMode: CAPTURE_MODES.live,
    still: null,
    stillWasReady: false,
    zoneOffsets: {},
    analysis: null,
    passportRecord: null,
  };
}

/**
 * Creates a store.
 * @param {object} initialState
 * @returns {{getState: () => object, setState: (patch: object) => void, subscribe: (listener: Function) => () => void}}
 */
export function createStore(initialState) {
  let state = Object.freeze({ ...initialState });
  const listeners = new Set();
  return {
    getState: () => state,
    setState(patch) {
      const previous = state;
      state = Object.freeze({ ...state, ...patch });
      listeners.forEach((listener) => listener(state, previous));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
