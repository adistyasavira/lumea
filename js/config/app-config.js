/**
 * LUMÉA — Application configuration: site links, the passport link format, booth
 * business values, passport export, drape rendering, the Book Now form service,
 * booth mode (admin PIN), the shared session log (Supabase), keyboard shortcuts
 * and UI timings.
 */

/** Public address on GitHub Pages; used for QR codes and share links. */
const SITE = Object.freeze({
  baseUrl: 'https://adistyasavira.github.io/lumea/',
  displayUrl: 'adistyasavira.github.io/lumea',
  /** Instagram handle without @, printed on the passport footer. */
  socialHandle: 'lumeaproject.id',
});

/**
 * Passport link opened from the QR code. Hash + query parameters only, so GitHub Pages
 * always serves index.html (no 404) and the customer's result travels inside the URL:
 * https://adistyasavira.github.io/lumea/#passport?season=deep-autumn&L=58&a=14&b=22&contrast=high
 */
const PASSPORT_LINK = Object.freeze({
  route: 'passport',
  params: Object.freeze({
    season: 'season',
    secondary: 'second',
    lightness: 'L',
    greenRed: 'a',
    blueYellow: 'b',
    contrast: 'contrast',
    contrastDelta: 'dL',
    confidence: 'conf',
    nickname: 'name',
    id: 'id',
    date: 'date',
  }),
  contrastLevels: Object.freeze(['low', 'medium', 'high']),
  /** ΔL* used for the contrast bar when a link only carries the contrast level. */
  contrastFallbackDelta: Object.freeze({ low: 20, medium: 32, high: 48 }),
  /** Valid CIELAB ranges for values read from a link. */
  labLimits: Object.freeze({ lightnessMin: 0, lightnessMax: 100, chromaticMax: 128 }),
  confidenceMax: 100,
  decimals: 1,
});

/**
 * Booth packages. One analysis = one person, so a Bundle Duo is recorded as two
 * sessions of price / people each (Rp 12.500), which keeps the recap total exact.
 */
const PACKAGES = Object.freeze({
  solo: Object.freeze({ code: 'solo', label: 'Solo Session (1 Orang)', shortLabel: 'Solo', people: 1, price: 15000 }),
  bundle: Object.freeze({ code: 'bundle', label: 'Bundle Duo (2 Orang)', shortLabel: 'Bundle Duo', people: 2, price: 25000 }),
});

/** Booth business values. */
const BOOTH = Object.freeze({
  packages: PACKAGES,
  defaultPackage: PACKAGES.solo.code,
  currency: 'IDR',
  locale: 'id-ID',
  nicknameMaxLength: 20,
});

/** Booking option text of a package, e.g. "Solo Session (1 Orang) — Rp 15.000". */
const toPackageOption = (bundle) => `${bundle.label} — Rp ${bundle.price.toLocaleString(BOOTH.locale)}`;

/** Passport identifiers and export size (1080 × 1920 story format). */
const PASSPORT = Object.freeze({
  idPrefix: 'LM',
  sequencePadding: 3,
  cssWidth: 360,
  exportScale: 3,
  fileNamePrefix: 'lumea-color-passport',
  metricDecimals: 1,
  paletteSize: 12,
});

/** QR code rendering (qrcode-generator library). */
const QR = Object.freeze({ typeNumber: 0, errorCorrection: 'M', cellSize: 4, margin: 2 });

/** Digital drape panels. Ratios are relative to the guide oval. */
const DRAPE = Object.freeze({
  panelSize: 220,
  cropPaddingRatio: 0.18,
  collarStartRatio: 0.44,
  collarCurveRatio: 0.12,
  bestCount: 2,
  avoidCount: 2,
});

/** "What suits me?" colour checker: CIEDE2000 distances. */
const CHECKER = Object.freeze({ matchDeltaE: 10, nearDeltaE: 18, alternativesCount: 4, defaultHex: '#C85A32' });

/**
 * Book Now and newsletter forms, sent by fetch POST to a static form service.
 *
 * Web3Forms (default): open https://web3forms.com, enter the email that should receive
 * bookings, copy the access key from the email you receive, and paste it below.
 * Formspree: create a form at https://formspree.io, set provider to 'formspree' and paste
 * the form endpoint (https://formspree.io/f/xxxxxxx). The receiving email is the one
 * registered with the service, so no address is stored in this public file.
 */
const BOOKING = Object.freeze({
  provider: 'web3forms',
  web3forms: Object.freeze({
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'a61b7591-3c49-4171-8d84-2443fbb3add6',
  }),
  formspree: Object.freeze({
    endpoint: '',
  }),
  fromName: 'LUMÉA Website',
  bookingSubject: 'Booking baru LUMÉA',
  newsletterSubject: 'Pendaftar newsletter LUMÉA',
  requestTimeoutMilliseconds: 15000,
  consultationTypes: Object.freeze(Object.values(PACKAGES).map(toPackageOption)),
  limits: Object.freeze({
    nameMinLength: 2,
    nameMaxLength: 60,
    phoneMinDigits: 9,
    phoneMaxDigits: 15,
    messageMaxLength: 500,
  }),
});

/**
 * Booth mode (admin). Only analyses made while booth mode is on are counted in
 * Rekapan Hari Ini and in the revenue. Unlock: open #recap directly, or tap the
 * LUMÉA logo `logoTapCount` times within `logoTapWindowMilliseconds`.
 * NOTE: this file is public on GitHub Pages, so the PIN keeps casual visitors out
 * but is readable by anyone who opens the source. Change it before the event.
 */
const ADMIN = Object.freeze({
  pin: '2026',
  logoTapCount: 5,
  logoTapWindowMilliseconds: 2500,
  maxPinAttempts: 5,
  lockoutMilliseconds: 30000,
  /** Booth laptops. `code` goes into the passport number so the two laptops never collide. */
  devices: Object.freeze([
    Object.freeze({ code: 'L1', label: 'Laptop 1' }),
    Object.freeze({ code: 'L2', label: 'Laptop 2' }),
  ]),
  /** Passport number segment for analyses outside booth mode (not counted). */
  publicDeviceCode: 'W',
});

/**
 * Shared session log for both laptops (Supabase). Leave supabaseUrl empty to keep
 * everything in this browser's localStorage only. Create the table with
 * supabase/schema.sql. The anon key is meant to be public; access is limited by
 * the row-level security rules in that file.
 */
const SYNC = Object.freeze({
  supabaseUrl: 'https://dcgtjtxpbdyaayakyryu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZ3RqdHhwYmR5YWF5YWt5cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5ODI1MjksImV4cCI6MjExMDU1ODUyOX0.R7F-uknweTSiSKCbDCmjkrTSJ5GjAeX1Z3LrHFhIGFE',
  table: 'booth_sessions',
  libraryUrl: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
  requestTimeoutMilliseconds: 8000,
  /** Fallback refresh of an open recap page in case realtime updates are blocked. */
  refreshIntervalMilliseconds: 20000,
  /** How often queued offline sessions are retried while the page is open. */
  retryIntervalMilliseconds: 30000,
});

/** Today's booth recap and its CSV export. */
const RECAP = Object.freeze({
  maxLogEntries: 500,
  csvSeparator: ';',
  csvFileNamePrefix: 'lumea-rekap',
});

/** Operator shortcuts on the Consultations page (KeyboardEvent.key, lower-cased). */
const SHORTCUTS = Object.freeze({ capture: ' ', retake: 'r', analyze: 'enter', nextSession: 'n' });

/** Local storage keys (per device, booth recap only — never photos). */
const STORAGE_KEYS = Object.freeze({
  sessionLog: 'lumea.session-log.v3',
  publicCounter: 'lumea.public-counter.v1',
  boothMode: 'lumea.booth-mode.v1',
  boothSettings: 'lumea.booth-settings.v1',
});

/** UI timings. */
const UI_TIMING = Object.freeze({
  toastMilliseconds: 3200,
  analysisStepMilliseconds: 450,
  resetConfirmMilliseconds: 4000,
});

export const APP_CONFIG = Object.freeze({
  site: SITE,
  passportLink: PASSPORT_LINK,
  booth: BOOTH,
  passport: PASSPORT,
  qr: QR,
  drape: DRAPE,
  checker: CHECKER,
  booking: BOOKING,
  admin: ADMIN,
  sync: SYNC,
  recap: RECAP,
  shortcuts: SHORTCUTS,
  storageKeys: STORAGE_KEYS,
  uiTiming: UI_TIMING,
});
