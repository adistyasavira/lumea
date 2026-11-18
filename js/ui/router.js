/**
 * LUMÉA — Hash router: #home, #palettes, #consultation, #passport?season=… and so on.
 * Hash routing keeps GitHub Pages happy (the server only ever serves index.html, so a
 * scanned QR link can never 404) and keeps passport data on the device (the hash is
 * never sent to the server). "#/route" is accepted too.
 */

const HASH_PREFIX = '#';
const LEGACY_SLASH = '/';
const QUERY_SEPARATOR = '?';

/**
 * Parses a location hash.
 * @param {string} hash
 * @param {string} fallbackRoute
 * @returns {{route:string, params:URLSearchParams}}
 */
export function parseHash(hash, fallbackRoute) {
  const body = hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : hash;
  const path = body.startsWith(LEGACY_SLASH) ? body.slice(LEGACY_SLASH.length) : body;
  const separatorIndex = path.indexOf(QUERY_SEPARATOR);
  const route = separatorIndex === -1 ? path : path.slice(0, separatorIndex);
  const query = separatorIndex === -1 ? '' : path.slice(separatorIndex + QUERY_SEPARATOR.length);
  return { route: route || fallbackRoute, params: new URLSearchParams(query) };
}

/**
 * Builds a hash for a route with optional parameters.
 * @param {string} route
 * @param {Record<string,string>} [params]
 * @returns {string}
 */
export function buildHash(route, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${HASH_PREFIX}${route}${query ? `${QUERY_SEPARATOR}${query}` : ''}`;
}

/**
 * Starts the router.
 * @param {{routes:string[], fallbackRoute:string, onChange:(route:string, params:URLSearchParams)=>void}} options
 */
export function startRouter(options) {
  const handle = () => {
    const { route, params } = parseHash(window.location.hash, options.fallbackRoute);
    const knownRoute = options.routes.includes(route) ? route : options.fallbackRoute;
    options.onChange(knownRoute, params);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
