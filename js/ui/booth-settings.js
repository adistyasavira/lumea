/**
 * LUMÉA — Capture settings that persist across customers on one device
 * (e.g. the grey card is in frame).
 */
import { APP_CONFIG } from '../config/app-config.js';
import { readJson, writeJson } from '../storage/local-store.js';

const KEY = APP_CONFIG.storageKeys.boothSettings;

/**
 * @returns {{useReference:boolean}}
 */
export function loadBoothSettings() {
  return { useReference: false, ...readJson(KEY) };
}

/**
 * @param {{useReference:boolean}} settings
 */
export function saveBoothSettings(settings) {
  writeJson(KEY, settings);
}
