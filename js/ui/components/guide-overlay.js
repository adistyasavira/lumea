/**
 * LUMÉA — Face alignment guide drawn as SVG over the camera: dimmed surround,
 * oval, eye line and the sampling zones. In review mode zones can be dragged to
 * recalibrate where pixels are read.
 */
import { createSvgElement, replaceChildren } from '../dom.js';
import { CAPTURE_CONFIG } from '../../config/capture-config.js';
import { computeReferenceRect } from '../../analysis/zone-geometry.js';

const ZONE_KIND_CLASSES = Object.freeze({ skin: 'guide__zone--skin', brow: 'guide__zone--brow', hair: 'guide__zone--hair' });
const LABEL_OFFSET = 4;

/** Ellipse path for the evenodd mask. */
function ellipsePath(oval) {
  const rx = oval.width / 2;
  const ry = oval.height / 2;
  return `M${oval.cx - rx},${oval.cy} a${rx},${ry} 0 1,0 ${oval.width},0 a${rx},${ry} 0 1,0 ${-oval.width},0 Z`;
}

/** Dimmed area outside the oval. */
function createMask(frame, oval) {
  const outer = `M0,0 H${frame.width} V${frame.height} H0 Z`;
  return createSvgElement('path', { d: `${outer} ${ellipsePath(oval)}`, 'fill-rule': 'evenodd', class: 'guide__mask' });
}

/** Oval outline and eye line. */
function createOutline(oval) {
  const eyeY = oval.cy + oval.height * CAPTURE_CONFIG.guideOval.eyeLineOffsetRatio;
  const halfEye = oval.width / 2;
  return createSvgElement('g', { class: 'guide__outline' }, [
    createSvgElement('ellipse', { cx: oval.cx, cy: oval.cy, rx: oval.width / 2, ry: oval.height / 2, class: 'guide__oval' }),
    createSvgElement('line', { x1: oval.cx - halfEye, x2: oval.cx + halfEye, y1: eyeY, y2: eyeY, class: 'guide__eyeline' }),
  ]);
}

/** One sampling zone rectangle with a short label. */
function createZone(zoneId, rect, interactive) {
  const zone = CAPTURE_CONFIG.zones[zoneId];
  const label = createSvgElement('text', { x: rect.x, y: rect.y - LABEL_OFFSET, class: 'guide__zone-label' });
  label.textContent = zone.label;
  return createSvgElement('g', {
    class: `guide__zone ${ZONE_KIND_CLASSES[zone.kind]}${interactive ? ' guide__zone--interactive' : ''}`,
    'data-zone': zoneId,
  }, [
    createSvgElement('rect', { x: rect.x, y: rect.y, width: rect.w, height: rect.h, rx: 2 }),
    interactive ? label : null,
  ]);
}

/** Outline of the grey card position. */
function createReferenceMarker(frame) {
  const rect = computeReferenceRect(frame);
  return createSvgElement('rect', { x: rect.x, y: rect.y, width: rect.w, height: rect.h, class: 'guide__reference' });
}

/**
 * Draws the overlay.
 * @param {SVGSVGElement} svg
 * @param {{frame:{width:number,height:number}, oval:object, rects:Record<string,object>, interactive:boolean, showReference:boolean}} scene
 */
export function renderGuideOverlay(svg, scene) {
  svg.setAttribute('viewBox', `0 0 ${scene.frame.width} ${scene.frame.height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.dataset.interactive = String(scene.interactive);
  const zones = Object.entries(scene.rects).map(([zoneId, rect]) => createZone(zoneId, rect, scene.interactive));
  replaceChildren(svg, [
    createMask(scene.frame, scene.oval),
    createOutline(scene.oval),
    scene.showReference ? createReferenceMarker(scene.frame) : null,
    createSvgElement('g', { class: 'guide__zones' }, zones),
  ]);
}

/**
 * Converts a pointer position to SVG user units.
 * @param {SVGSVGElement} svg
 * @param {PointerEvent} event
 * @returns {{x:number, y:number}}
 */
function toSvgPoint(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
  return { x: transformed.x, y: transformed.y };
}

/**
 * Lets the operator drag zones while the overlay is interactive.
 * @param {SVGSVGElement} svg
 * @param {{getOffset:(zoneId:string)=>{dx:number,dy:number}, onChange:(zoneId:string, offset:{dx:number,dy:number})=>void}} handlers
 */
export function enableZoneDragging(svg, handlers) {
  let drag = null;
  svg.addEventListener('pointerdown', (event) => {
    const zoneElement = event.target instanceof Element ? event.target.closest('[data-zone]') : null;
    if (!zoneElement || svg.dataset.interactive !== 'true') return;
    const zoneId = zoneElement.getAttribute('data-zone');
    drag = { zoneId, start: toSvgPoint(svg, event), origin: handlers.getOffset(zoneId) };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = toSvgPoint(svg, event);
    handlers.onChange(drag.zoneId, { dx: drag.origin.dx + point.x - drag.start.x, dy: drag.origin.dy + point.y - drag.start.y });
  });
  const endDrag = () => { drag = null; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
}
