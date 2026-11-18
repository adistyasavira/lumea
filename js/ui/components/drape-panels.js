/**
 * LUMÉA — Digital drape: the customer's face with a coloured collar below the
 * chin, best colours side by side with colours to avoid.
 */
import { createElement } from '../dom.js';
import { APP_CONFIG } from '../../config/app-config.js';

const { drape: DRAPE } = APP_CONFIG;

/**
 * Square crop around the oval so the face fills the square panel.
 * @param {object} oval
 * @param {{width:number, height:number}} frame
 * @returns {{x:number, y:number, w:number, h:number}}
 */
function computeSquareCrop(oval, frame) {
  const side = Math.min(oval.height * (1 + DRAPE.cropPaddingRatio), frame.width, frame.height);
  const x = Math.min(Math.max(oval.cx - side / 2, 0), frame.width - side);
  const y = Math.min(Math.max(oval.cy - side / 2, 0), frame.height - side);
  return { x, y, w: side, h: side };
}

/** Draws the face crop, then the collar shape filled with the drape colour. */
function paintPanel(context, source, crop, oval, hex) {
  const size = DRAPE.panelSize;
  const scale = size / Math.max(crop.w, crop.h);
  context.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w * scale, crop.h * scale);
  const collarY = (oval.cy + oval.height * DRAPE.collarStartRatio - crop.y) * scale;
  const curve = oval.height * DRAPE.collarCurveRatio * scale;
  context.fillStyle = hex;
  context.beginPath();
  context.moveTo(0, collarY - curve);
  context.quadraticCurveTo(size / 2, collarY + curve, size, collarY - curve);
  context.lineTo(size, size);
  context.lineTo(0, size);
  context.closePath();
  context.fill();
}

/**
 * One drape panel.
 * @param {HTMLCanvasElement} source canvas holding the captured still
 * @param {object} oval guide oval in source pixels
 * @param {{name:string, hex:string}} swatch
 * @param {'best'|'avoid'} kind
 * @returns {HTMLElement}
 */
function createPanel(source, oval, swatch, kind) {
  const crop = computeSquareCrop(oval, source);
  const canvas = createElement('canvas', { className: 'drape__canvas', attrs: { width: DRAPE.panelSize, height: DRAPE.panelSize } });
  paintPanel(canvas.getContext('2d'), source, crop, oval, swatch.hex);
  const verdict = kind === 'best' ? 'Terbaik' : 'Hindari';
  return createElement('figure', { className: `drape drape--${kind}` }, [
    canvas,
    createElement('figcaption', { className: 'drape__caption' }, [
      createElement('span', { className: 'drape__verdict', text: verdict }),
      createElement('span', { text: swatch.name }),
      createElement('span', { className: 'mono', text: swatch.hex }),
    ]),
  ]);
}

/**
 * All drape panels for a season.
 * @param {HTMLCanvasElement} source
 * @param {object} oval
 * @param {object} season
 * @returns {HTMLElement[]}
 */
export function createDrapePanels(source, oval, season) {
  const best = season.palette.slice(0, DRAPE.bestCount).map((swatch) => createPanel(source, oval, swatch, 'best'));
  const avoid = season.avoid.slice(0, DRAPE.avoidCount).map((swatch) => createPanel(source, oval, swatch, 'avoid'));
  return [best[0], avoid[0], best[1], avoid[1]].filter(Boolean);
}
