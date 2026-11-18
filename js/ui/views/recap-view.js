/**
 * LUMÉA — Rekapan Booth Hari Ini (booth mode only): sessions and revenue from both
 * laptops, the season tally per family, the session log and a CSV export. Data
 * comes from Supabase when configured, otherwise from this laptop.
 */
import { APP_CONFIG } from '../../config/app-config.js';
import { getSeasonById } from '../../data/seasons.js';
import { SEASON_FAMILIES, getSeasonsOfFamily } from '../../data/season-families.js';
import { formatDisplayDate, toIsoDate } from '../../passport/passport-model.js';
import { isBoothMode, getBoothDevice, disableBoothMode } from '../../admin/booth-mode.js';
import { loadDay, clearLocalCopy, watchSessions, RECAP_SOURCES } from '../../recap/session-repository.js';
import { summarizeSessions, formatRupiah } from '../../recap/recap-summary.js';
import { findPackage } from '../../recap/pricing.js';
import { downloadCsv } from '../../recap/csv-export.js';
import { query, delegate, replaceChildren, createElement, bindText, setHidden } from '../dom.js';

const EMPTY_VALUE = '—';
const PERCENT = 100;
const LOG_COLUMNS = 7;
const CLEAR_LABEL = 'HAPUS DATA LOKAL LAPTOP INI';
const CLEAR_CONFIRM_LABEL = 'KLIK LAGI UNTUK MENGHAPUS';

/** Status line per data source. */
function describeSource(result, summary) {
  const perDevice = Object.entries(summary.devices).map(([label, count]) => `${label}: ${count}`).join(' · ');
  const pending = result.pendingCount > 0 ? ` ${result.pendingCount} sesi laptop ini menunggu terkirim.` : '';
  if (result.source === RECAP_SOURCES.cloud) return { tone: 'success', text: `Tersinkron Supabase, gabungan semua laptop.${perDevice ? ` ${perDevice}.` : ''}${pending}` };
  if (result.source === RECAP_SOURCES.offline) return { tone: 'error', text: `Offline atau Supabase tidak terjangkau: menampilkan data laptop ini saja.${pending}` };
  return { tone: 'info', text: 'Mode lokal: Supabase belum diatur di app-config.js, jadi rekap ini hanya dari laptop ini.' };
}

/**
 * One sub-season row with a proportional bar.
 * @param {object} season
 * @param {number} count
 * @param {number} total
 * @returns {HTMLElement}
 */
function createSeasonRow(season, count, total) {
  const share = total > 0 ? Math.round((count / total) * PERCENT) : 0;
  return createElement('div', { className: `recap-season${count === 0 ? ' recap-season--empty' : ''}` }, [
    createElement('span', { className: 'cat-swatch-color', vars: { swatch: season.palette[0].hex }, attrs: { 'aria-hidden': 'true' } }),
    createElement('span', { className: 'recap-season__name', text: season.name }),
    createElement('span', { className: 'recap-season__bar', vars: { share: `${share}%` }, attrs: { 'aria-hidden': 'true' } }),
    createElement('span', { className: 'recap-season__count mono', text: String(count) }),
  ]);
}

/** Family blocks with their three sub-seasons (all 12 seasons always listed). */
function createFamilyTallies(summary) {
  return SEASON_FAMILIES.map((family) => {
    const seasons = getSeasonsOfFamily(family.name);
    const familyTotal = seasons.reduce((sum, season) => sum + (summary.seasons[season.id] ?? 0), 0);
    return createElement('div', { className: 'recap-family' }, [
      createElement('div', { className: 'recap-family__head' }, [
        createElement('span', { text: family.name.toUpperCase() }),
        createElement('span', { className: 'mono', text: String(familyTotal) }),
      ]),
      ...seasons.map((season) => createSeasonRow(season, summary.seasons[season.id] ?? 0, summary.sessions)),
    ]);
  });
}

/** People per package under the revenue, e.g. "Solo 3 orang · Bundle Duo 2 orang". */
function describePackages(summary) {
  return Object.entries(summary.packages)
    .map(([code, people]) => `${findPackage(code).shortLabel} ${people} orang`)
    .join(' · ');
}

/** Session log rows, newest first. */
function createLogRows(entries) {
  if (entries.length === 0) {
    return [createElement('tr', {}, [createElement('td', { className: 'recap-table__empty', text: 'Belum ada sesi hari ini.', attrs: { colspan: LOG_COLUMNS } })])];
  }
  return entries.map((entry) => createElement('tr', {}, [
    createElement('td', { className: 'mono', text: entry.time }),
    createElement('td', { text: entry.deviceLabel }),
    createElement('td', { className: 'mono', text: entry.passportId }),
    createElement('td', { text: entry.nickname || EMPTY_VALUE }),
    createElement('td', { text: getSeasonById(entry.seasonId)?.name ?? entry.seasonId }),
    createElement('td', { text: `${findPackage(entry.packageCode).shortLabel} · ${formatRupiah(entry.price)}` }),
    createElement('td', { className: 'mono', text: entry.confidence === null || entry.confidence === undefined ? EMPTY_VALUE : `${entry.confidence}%` }),
  ]));
}

/** Controls the recap view. */
export class RecapView {
  /**
   * @param {{root:HTMLElement, notify:(message:string, tone?:string)=>void, requestUnlock:()=>void, onBoothModeChange:()=>void}} deps
   */
  constructor({ root, notify, requestUnlock, onBoothModeChange }) {
    this.root = root;
    this.notify = notify;
    this.requestUnlock = requestUnlock;
    this.onBoothModeChange = onBoothModeChange;
    this.entries = [];
    this.isVisible = false;
    this.stopWatching = () => {};
    this.clearTimer = null;
    this.clearButton = query('[data-action="clear-local"]', root);
    this.bindActions();
  }

  bindActions() {
    const actions = {
      'export-csv': () => this.exportCsv(),
      'clear-local': () => this.onClearLocal(),
      'exit-booth': () => this.exitBoothMode(),
      'unlock-recap': () => this.requestUnlock(),
    };
    delegate(this.root, 'click', '[data-action]', (event, target) => {
      const action = actions[target.dataset.action];
      if (action) action();
    });
  }

  /** Called by the router: locked panel for visitors, live recap in booth mode. */
  show() {
    this.isVisible = true;
    const unlocked = isBoothMode();
    setHidden(query('[data-recap-content]', this.root), !unlocked);
    setHidden(query('[data-recap-locked]', this.root), unlocked);
    if (!unlocked) {
      this.requestUnlock();
      return;
    }
    this.refresh();
    this.stopWatching();
    this.stopWatching = watchSessions(() => this.refresh());
  }

  hide() {
    this.isVisible = false;
    this.stopWatching();
    this.stopWatching = () => {};
    this.disarmClear();
  }

  /** Reloads today's sessions (only while the page is open in booth mode). */
  async refresh() {
    if (!this.isVisible || !isBoothMode()) return;
    const isoDate = toIsoDate(new Date());
    const result = await loadDay(isoDate);
    this.entries = result.entries;
    this.render(isoDate, result);
  }

  render(isoDate, result) {
    const summary = summarizeSessions(result.entries);
    const status = describeSource(result, summary);
    const device = getBoothDevice();
    bindText(this.root, 'recap-date', `${formatDisplayDate(isoDate)} · Perangkat ini: ${device?.label ?? EMPTY_VALUE}`);
    bindText(this.root, 'recap-sessions', String(summary.sessions));
    bindText(this.root, 'recap-revenue', formatRupiah(summary.revenue));
    bindText(this.root, 'recap-packages', describePackages(summary));
    bindText(this.root, 'recap-top', summary.topSeasonId ? getSeasonById(summary.topSeasonId)?.name ?? summary.topSeasonId : EMPTY_VALUE);
    const statusLine = query('[data-recap-status]', this.root);
    statusLine.className = `form-status form-status--${status.tone}`;
    statusLine.textContent = status.text;
    replaceChildren(query('[data-recap-families]', this.root), createFamilyTallies(summary));
    replaceChildren(query('[data-recap-log]', this.root), createLogRows(result.entries));
  }

  exportCsv() {
    if (this.entries.length === 0) {
      this.notify('Belum ada sesi untuk diekspor hari ini.', 'info');
      return;
    }
    downloadCsv(this.entries, toIsoDate(new Date()));
    this.notify(`CSV berisi ${this.entries.length} sesi sudah diunduh.`, 'success');
  }

  /** Two-step clear of this laptop's copy; the shared Supabase log stays intact. */
  onClearLocal() {
    if (!this.clearTimer) {
      this.clearButton.textContent = CLEAR_CONFIRM_LABEL;
      this.clearTimer = setTimeout(() => this.disarmClear(), APP_CONFIG.uiTiming.resetConfirmMilliseconds);
      return;
    }
    this.disarmClear();
    clearLocalCopy(toIsoDate(new Date()));
    this.notify('Data lokal laptop ini untuk hari ini sudah dihapus.', 'success');
    this.refresh();
  }

  disarmClear() {
    clearTimeout(this.clearTimer);
    this.clearTimer = null;
    this.clearButton.textContent = CLEAR_LABEL;
  }

  exitBoothMode() {
    disableBoothMode();
    this.onBoothModeChange();
    this.notify('Mode Booth dimatikan di browser ini. Sesi berikutnya tidak dicatat.', 'info');
    window.location.hash = '#home';
  }
}
