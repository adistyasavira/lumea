/**
 * LUMÉA — Entry point. Creates the store, the views, the booking modal, the admin
 * PIN gate (Mode Booth) and the router. No globals: everything is wired here and
 * passed down.
 */
import { createStore, createInitialSession } from './ui/store.js';
import { startRouter } from './ui/router.js';
import { query, queryAll, delegate, setHidden } from './ui/dom.js';
import { showToast } from './ui/components/toast.js';
import { loadBoothSettings } from './ui/booth-settings.js';
import { getBoothDevice } from './admin/booth-mode.js';
import { startPendingRetry } from './recap/session-repository.js';
import { HomeView } from './ui/views/home-view.js';
import { PalettesView } from './ui/views/palettes-view.js';
import { ConsultationView } from './ui/views/consultation-view.js';
import { CheckerView } from './ui/views/checker-view.js';
import { RecapView } from './ui/views/recap-view.js';
import { JournalView } from './ui/views/journal-view.js';
import { PassportView } from './ui/views/passport-view.js';
import { BookingView } from './ui/views/booking-view.js';
import { AdminGate } from './ui/views/admin-gate.js';

const ROUTES = Object.freeze({
  home: 'home',
  method: 'method',
  palettes: 'palettes',
  consultation: 'consultation',
  whatSuitsMe: 'what-suits-me',
  recap: 'recap',
  journal: 'journal',
  passport: 'passport',
});

/** A view with no behaviour of its own (Our Method). */
const STATIC_VIEW = Object.freeze({ show() {}, hide() {} });

const viewRoot = (name) => query(`[data-view="${name}"]`);

/** Current route from the hash (enough for the admin gate). */
const currentRoute = () => window.location.hash.replace(/^#\/?/, '').split('?')[0];

/** Shows or hides everything that only booth laptops see (recap link, badge). */
function refreshBoothChrome() {
  const device = getBoothDevice();
  queryAll('[data-booth-only]').forEach((element) => setHidden(element, !device));
  const badge = query('[data-booth-badge]');
  badge.textContent = device ? `MODE BOOTH · ${device.label.toUpperCase()}` : '';
  setHidden(badge, !device);
}

/** Builds every view. */
function createViews(store, notify, recap) {
  return {
    [ROUTES.home]: new HomeView({ root: viewRoot(ROUTES.home) }),
    [ROUTES.method]: STATIC_VIEW,
    [ROUTES.palettes]: new PalettesView({ root: viewRoot(ROUTES.palettes) }),
    [ROUTES.consultation]: new ConsultationView({
      root: viewRoot(ROUTES.consultation), loader: query('[data-analysis-loader]'), store, notify, onSessionRecorded: () => recap.refresh(),
    }),
    [ROUTES.whatSuitsMe]: new CheckerView({ root: viewRoot(ROUTES.whatSuitsMe), notify }),
    [ROUTES.recap]: recap,
    [ROUTES.journal]: new JournalView({ root: viewRoot(ROUTES.journal), dialog: query('[data-reader]') }),
    [ROUTES.passport]: new PassportView({ root: viewRoot(ROUTES.passport), notify }),
  };
}

/** Opens and closes the mobile menu. */
function setMenuOpen(isOpen) {
  query('[data-nav-menu]').classList.toggle('mobile-open', isOpen);
  query('[data-action="toggle-menu"]').setAttribute('aria-expanded', String(isOpen));
}

function bindMobileMenu() {
  const menu = query('[data-nav-menu]');
  delegate(document, 'click', '[data-action="toggle-menu"]', () => setMenuOpen(!menu.classList.contains('mobile-open')));
  delegate(menu, 'click', 'a', () => setMenuOpen(false));
}

/** Shows one view, hides the others and highlights the navigation. */
function activateView(views, route, params) {
  Object.entries(views).forEach(([name, view]) => {
    const isActive = name === route;
    setHidden(viewRoot(name), !isActive);
    if (isActive) view.show(params);
    else view.hide();
  });
  queryAll('[data-route-link]').forEach((link) => {
    const isCurrent = link.dataset.routeLink === route;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.body.dataset.route = route;
  window.scrollTo({ top: 0 });
}

/**
 * Admin PIN gate plus the recap view it unlocks. Opening the recap after unlocking
 * works from any page (logo taps) and from #recap itself (no hashchange there).
 */
function createBoothAccess(notify) {
  let stopRetry = () => {};
  const onBoothModeChange = () => {
    refreshBoothChrome();
    stopRetry();
    stopRetry = getBoothDevice() ? startPendingRetry() : () => {};
  };
  let recap = null;
  const gate = new AdminGate({
    modal: query('[data-admin-modal]'),
    logo: query('[data-brand-logo]'),
    onUnlocked: () => {
      onBoothModeChange();
      if (currentRoute() === ROUTES.recap) recap.show();
      else window.location.hash = `#${ROUTES.recap}`;
    },
    onCancelled: () => {
      if (currentRoute() === ROUTES.recap && !getBoothDevice()) window.location.hash = `#${ROUTES.home}`;
    },
  });
  recap = new RecapView({ root: viewRoot(ROUTES.recap), notify, requestUnlock: () => gate.open(), onBoothModeChange });
  onBoothModeChange();
  return recap;
}

function bootstrap() {
  const toastRegion = query('[data-toasts]');
  const notify = (message, tone) => showToast(toastRegion, message, tone);
  const store = createStore({ ...createInitialSession(), ...loadBoothSettings() });
  const recap = createBoothAccess(notify);
  const views = createViews(store, notify, recap);
  new BookingView({ modal: query('[data-booking-modal]'), newsletterRoot: query('.newsletter-section') });
  bindMobileMenu();
  startRouter({
    routes: Object.values(ROUTES),
    fallbackRoute: ROUTES.home,
    onChange: (route, params) => activateView(views, route, params),
  });
}

bootstrap();
