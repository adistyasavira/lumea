/**
 * LUMÉA — Digital Color Passport on the customer's phone, opened from the QR code
 * (#passport?season=…&L=…&a=…&b=…&contrast=…). The page is rebuilt entirely from
 * the link, so it works on any phone without the booth's storage.
 */
import { decodePassportParams } from '../../passport/passport-link.js';
import { expandPassport } from '../../passport/passport-model.js';
import { renderToPng, shareOrDownload, buildFileName } from '../../passport/passport-export.js';
import { createPassportCard } from '../components/passport-card.js';
import { query, delegate, replaceChildren, setHidden, bindText } from '../dom.js';
import { buildHash } from '../router.js';

const FALLBACK_FILE_ID = 'passport';

/** Controls the passport page. */
export class PassportView {
  /**
   * @param {{root:HTMLElement, notify:(message:string, tone?:string)=>void}} deps
   */
  constructor({ root, notify }) {
    this.root = root;
    this.notify = notify;
    this.passport = null;
    delegate(root, 'click', '[data-action="save-passport"]', () => this.save());
  }

  /**
   * Called by the router with the link parameters.
   * @param {URLSearchParams} params
   */
  show(params) {
    const record = decodePassportParams(params);
    this.passport = record ? expandPassport(record) : null;
    setHidden(query('[data-passport-content]', this.root), !this.passport);
    setHidden(query('[data-passport-error]', this.root), Boolean(this.passport));
    if (!this.passport) return;
    const { season } = this.passport;
    replaceChildren(query('[data-passport-card]', this.root), [createPassportCard(this.passport)]);
    bindText(this.root, 'passport-season', season.name);
    bindText(this.root, 'passport-tagline', `${season.family} family · ${season.tagline}`);
    query('[data-passport-checker]', this.root).href = buildHash('what-suits-me', { season: season.id });
    query('[data-passport-palettes]', this.root).href = buildHash('palettes');
  }

  hide() {}

  /** Saves or shares the PNG. */
  async save() {
    if (!this.passport) return;
    try {
      const blob = await renderToPng(query('[data-passport-card] .passport', this.root));
      const fileName = buildFileName(this.passport.id || `${FALLBACK_FILE_ID}-${this.passport.season.id}`);
      const outcome = await shareOrDownload(blob, fileName, `Season-ku ${this.passport.season.name} di LUMÉA`);
      this.notify(outcome === 'shared' ? 'Passport dibagikan.' : 'Passport tersimpan.', 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') this.notify(error.message, 'error');
    }
  }
}
