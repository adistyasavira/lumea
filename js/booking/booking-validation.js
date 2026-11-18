/**
 * LUMÉA — Validation for the Book Now and newsletter forms. Pure functions: each
 * returns a map of field name → Indonesian error message (empty when valid).
 */
import { APP_CONFIG } from '../config/app-config.js';

const { limits: LIMITS, consultationTypes: CONSULTATION_TYPES } = APP_CONFIG.booking;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NON_DIGITS = /\D/g;
const PHONE_ALLOWED = /^[+\d\s()-]+$/;

/**
 * @param {string} name
 * @returns {string} error message or ''
 */
function validateName(name) {
  if (name.length < LIMITS.nameMinLength) return `Nama minimal ${LIMITS.nameMinLength} huruf.`;
  if (name.length > LIMITS.nameMaxLength) return `Nama maksimal ${LIMITS.nameMaxLength} huruf.`;
  return '';
}

/**
 * @param {string} email
 * @returns {string}
 */
export function validateEmail(email) {
  if (!email) return 'Email wajib diisi.';
  return EMAIL_PATTERN.test(email) ? '' : 'Format email belum benar, contoh: nama@email.com.';
}

/**
 * WhatsApp number: digits with optional +, spaces, brackets and dashes.
 * @param {string} phone
 * @returns {string}
 */
function validatePhone(phone) {
  if (!phone) return 'Nomor WhatsApp wajib diisi.';
  const digits = phone.replace(NON_DIGITS, '').length;
  const isShapeValid = PHONE_ALLOWED.test(phone);
  const isLengthValid = digits >= LIMITS.phoneMinDigits && digits <= LIMITS.phoneMaxDigits;
  return isShapeValid && isLengthValid ? '' : `Nomor WhatsApp berisi ${LIMITS.phoneMinDigits}–${LIMITS.phoneMaxDigits} angka, contoh: 0812 3456 7890.`;
}

/**
 * Preferred date: optional, but not in the past.
 * @param {string} isoDate YYYY-MM-DD or ''
 * @param {string} todayIso YYYY-MM-DD
 * @returns {string}
 */
function validateDate(isoDate, todayIso) {
  if (!isoDate) return '';
  return isoDate >= todayIso ? '' : 'Tanggal tidak boleh di masa lalu.';
}

/**
 * Validates a booking request.
 * @param {{name:string, email:string, phone:string, type:string, date:string, message:string}} data trimmed values
 * @param {string} todayIso
 * @returns {Record<string,string>} only fields with an error
 */
export function validateBooking(data, todayIso) {
  const errors = {
    name: validateName(data.name),
    email: validateEmail(data.email),
    phone: validatePhone(data.phone),
    type: CONSULTATION_TYPES.includes(data.type) ? '' : 'Pilih jenis konsultasi.',
    date: validateDate(data.date, todayIso),
    message: data.message.length > LIMITS.messageMaxLength ? `Pesan maksimal ${LIMITS.messageMaxLength} karakter.` : '',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/**
 * Validates a newsletter sign-up.
 * @param {{email:string}} data
 * @returns {Record<string,string>}
 */
export function validateNewsletter(data) {
  const error = validateEmail(data.email);
  return error ? { email: error } : {};
}
