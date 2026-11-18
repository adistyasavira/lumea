/**
 * LUMÉA — Journal in a news/editorial style: photo-led article cards and a
 * magazine-like reading modal with key points and sources.
 */
import { JOURNAL_ARTICLES, getArticleById } from '../../data/journal.js';
import { APP_CONFIG } from '../../config/app-config.js';
import { query, delegate, replaceChildren, createElement, bindText } from '../dom.js';

const META_SEPARATOR = ' • ';

/**
 * Formats an ISO date in Indonesian.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  return new Intl.DateTimeFormat(APP_CONFIG.booth.locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${isoDate}T00:00:00`));
}

/** The article palette as colour bands: the stand-in when the photo is missing. */
function createPaletteBands(article) {
  return article.cover.map((hex) => createElement('span', { className: 'journal-cover__band', vars: { swatch: hex } }));
}

/**
 * News photo of an article in a 16:9 frame. If the file cannot be loaded, the frame
 * falls back to the article palette so the layout never shows a broken image.
 * @param {object} article
 * @param {string} frameClass
 * @param {{eager?:boolean}} [options]
 * @returns {HTMLElement}
 */
function createArticleImage(article, frameClass, { eager = false } = {}) {
  const image = createElement('img', {
    className: 'journal-photo',
    attrs: { src: article.image, alt: `Foto artikel: ${article.title}`, loading: eager ? 'eager' : 'lazy', decoding: 'async' },
  });
  const frame = createElement('span', { className: frameClass }, [image]);
  image.addEventListener('error', () => {
    frame.classList.add('journal-cover');
    frame.setAttribute('role', 'img');
    frame.setAttribute('aria-label', `Palet warna artikel ${article.category}`);
    replaceChildren(frame, createPaletteBands(article));
  }, { once: true });
  return frame;
}

/** One article card. */
function createArticleCard(article) {
  const meta = [formatDate(article.publishedAt), `${article.readMinutes} menit baca`].join(META_SEPARATOR);
  return createElement('li', { className: 'journal-card' }, [
    createElement('button', { className: 'journal-card__button', attrs: { type: 'button' }, dataset: { article: article.id } }, [
      createArticleImage(article, 'journal-media'),
      createElement('span', { className: 'journal-category', text: article.category }),
      createElement('span', { className: 'journal-body' }, [
        createElement('span', { className: 'journal-date', text: meta }),
        createElement('span', { className: 'journal-title', text: article.title }),
        createElement('span', { className: 'journal-summary', text: article.summary }),
        createElement('span', { className: 'btn-text journal-more', text: 'READ ARTICLE' }),
      ]),
    ]),
  ]);
}

/** Article body sections. */
function createSections(article) {
  return article.sections.map((section) => createElement('section', { className: 'reader__section' }, [
    createElement('h3', { className: 'reader__heading', text: section.heading }),
    ...section.paragraphs.map((paragraph) => createElement('p', { text: paragraph })),
  ]));
}

/** Source list with publication dates. */
function createSources(article) {
  const items = article.sources.map((item) => createElement('li', {}, [
    createElement('a', { text: item.title, attrs: { href: item.url, target: '_blank', rel: 'noopener noreferrer' } }),
    createElement('span', { className: 'reader__source-meta', text: ` — ${item.publisher}, ${formatDate(item.date)}` }),
  ]));
  return createElement('ol', { className: 'reader__source-list' }, items);
}

/** Controls the Journal list and the reader modal. */
export class JournalView {
  /**
   * @param {{root:HTMLElement, dialog:HTMLDialogElement}} deps
   */
  constructor({ root, dialog }) {
    this.root = root;
    this.dialog = dialog;
    replaceChildren(query('[data-journal-list]', root), JOURNAL_ARTICLES.map(createArticleCard));
    delegate(root, 'click', '[data-article]', (event, target) => this.open(target.dataset.article));
    delegate(dialog, 'click', '[data-action="close-reader"]', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  show() {}

  hide() {
    if (this.dialog.open) this.dialog.close();
  }

  /** Opens an article in the reader modal. */
  open(articleId) {
    const article = getArticleById(articleId);
    if (!article) return;
    replaceChildren(query('[data-reader-hero]', this.dialog), [createArticleImage(article, 'reader__media', { eager: true })]);
    bindText(this.dialog, 'reader-category', article.category);
    bindText(this.dialog, 'reader-meta', [formatDate(article.publishedAt), `${article.readMinutes} menit baca`, 'LUMÉA Journal'].join(META_SEPARATOR));
    bindText(this.dialog, 'reader-title', article.title);
    bindText(this.dialog, 'reader-summary', article.summary);
    replaceChildren(query('[data-reader-points]', this.dialog), article.keyPoints.map((point) => createElement('li', { text: point })));
    replaceChildren(query('[data-reader-body]', this.dialog), createSections(article));
    replaceChildren(query('[data-reader-sources]', this.dialog), [createSources(article)]);
    this.dialog.showModal();
    query('[data-reader-scroll]', this.dialog).scrollTop = 0;
  }
}
