/**
 * LUMÉA — The hero colour wheel on the home page: one slice per colour around a
 * small gold centre, drawn as SVG.
 */
import { createSvgElement } from '../dom.js';

/** Wheel geometry in SVG user units. */
const WHEEL = Object.freeze({ size: 340, radius: 160, hubRadius: 35, coreRadius: 12, sliceStroke: 1.5, hubStroke: 2 });
const DEGREES_PER_TURN = 360;
const DEGREES_TO_RADIANS = Math.PI / 180;

/** Slice colours, clockwise from 3 o'clock. */
const WHEEL_COLORS = Object.freeze([
  '#C85A32', '#E8A589', '#F4A261', '#E9C46A', '#DBA159', '#828A5D',
  '#656D4A', '#3A6B68', '#243746', '#4A3525', '#9E472A', '#D48375',
  '#B8A3BA', '#8E9AAF', '#A3B19B', '#F4EBDD',
]);

/**
 * Point on the wheel rim.
 * @param {number} angleDegrees
 * @returns {{x:number, y:number}}
 */
function rimPoint(angleDegrees) {
  const center = WHEEL.size / 2;
  const radians = angleDegrees * DEGREES_TO_RADIANS;
  return { x: center + WHEEL.radius * Math.cos(radians), y: center + WHEEL.radius * Math.sin(radians) };
}

/**
 * One pie slice.
 * @param {string} color
 * @param {number} index
 * @param {number} count
 * @returns {SVGPathElement}
 */
function createSlice(color, index, count) {
  const center = WHEEL.size / 2;
  const start = rimPoint((index * DEGREES_PER_TURN) / count);
  const end = rimPoint(((index + 1) * DEGREES_PER_TURN) / count);
  const d = `M ${center} ${center} L ${start.x} ${start.y} A ${WHEEL.radius} ${WHEEL.radius} 0 0 1 ${end.x} ${end.y} Z`;
  return createSvgElement('path', { d, fill: color, class: 'color-wheel__slice', 'stroke-width': WHEEL.sliceStroke });
}

/**
 * Builds the wheel.
 * @returns {SVGSVGElement}
 */
export function createColorWheel() {
  const center = WHEEL.size / 2;
  const slices = WHEEL_COLORS.map((color, index) => createSlice(color, index, WHEEL_COLORS.length));
  return createSvgElement('svg', { class: 'color-wheel-svg', viewBox: `0 0 ${WHEEL.size} ${WHEEL.size}`, 'aria-hidden': 'true' }, [
    createSvgElement('g', {}, slices),
    createSvgElement('circle', { cx: center, cy: center, r: WHEEL.hubRadius, class: 'color-wheel__hub', 'stroke-width': WHEEL.hubStroke }),
    createSvgElement('circle', { cx: center, cy: center, r: WHEEL.coreRadius, class: 'color-wheel__core' }),
  ]);
}
