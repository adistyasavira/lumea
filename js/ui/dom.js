/**
 * LUMÉA — Small DOM helpers. Elements are always built with createElement and
 * textContent, never innerHTML, so dynamic text cannot inject markup.
 */

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * querySelector that fails loudly when a required element is missing.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element}
 */
export function query(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return element;
}

/**
 * querySelectorAll as an array.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element[]}
 */
export function queryAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Applies attributes, dataset entries and CSS custom properties to an element.
 * @param {Element} element
 * @param {{attrs?:object, dataset?:object, vars?:object}} options
 */
function applyOptions(element, options) {
  Object.entries(options.attrs ?? {}).forEach(([name, value]) => element.setAttribute(name, String(value)));
  Object.entries(options.dataset ?? {}).forEach(([name, value]) => { element.dataset[name] = String(value); });
  Object.entries(options.vars ?? {}).forEach(([name, value]) => element.style.setProperty(`--${name}`, String(value)));
}

/**
 * Creates an HTML element.
 * @param {string} tag
 * @param {{className?:string, text?:string, attrs?:object, dataset?:object, vars?:object}} [options]
 * @param {Array<Node|null|false>} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  applyOptions(element, options);
  element.append(...children.filter(Boolean));
  return element;
}

/**
 * Creates an SVG element with attributes.
 * @param {string} tag
 * @param {object} [attrs]
 * @param {Array<Node|null|false>} [children]
 * @returns {SVGElement}
 */
export function createSvgElement(tag, attrs = {}, children = []) {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, String(value)));
  element.append(...children.filter(Boolean));
  return element;
}

/**
 * Replaces all children of a node.
 * @param {Element} node
 * @param {Array<Node|null|false>} [children]
 */
export function replaceChildren(node, children = []) {
  node.replaceChildren(...children.filter(Boolean));
}

/**
 * Shows or hides an element with the hidden attribute.
 * @param {Element} element
 * @param {boolean} hidden
 */
export function setHidden(element, hidden) {
  element.hidden = hidden;
}

/**
 * Sets the text of the element marked data-bind="key" inside root.
 * @param {ParentNode} root
 * @param {string} key
 * @param {string} text
 */
export function bindText(root, key, text) {
  query(`[data-bind="${key}"]`, root).textContent = text;
}

/**
 * Delegated event listener: one listener on root, filtered by selector.
 * @param {Element|Document} root
 * @param {string} type
 * @param {string} selector
 * @param {(event: Event, target: Element) => void} handler
 * @returns {() => void} unsubscribe
 */
export function delegate(root, type, selector, handler) {
  const listener = (event) => {
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}
