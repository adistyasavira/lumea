/**
 * LUMÉA — The four measured axes as labelled bars with the raw CIELAB number.
 */
import { createElement } from '../dom.js';
import { APP_CONFIG } from '../../config/app-config.js';

/**
 * One metric row.
 * @param {{title:string, unit:string, caption:string, value:number, label:string, position:number}} metric
 * @param {boolean} showCaption
 * @returns {HTMLElement}
 */
function createMetricRow(metric, showCaption) {
  const valueText = `${metric.value.toFixed(APP_CONFIG.passport.metricDecimals)} ${metric.unit}`;
  return createElement('li', { className: 'metric' }, [
    createElement('div', { className: 'metric__head' }, [
      createElement('span', { className: 'metric__title', text: metric.title }),
      createElement('span', { className: 'metric__label', text: metric.label }),
      createElement('span', { className: 'metric__value mono', text: valueText }),
    ]),
    createElement('div', { className: 'metric__track', attrs: { 'aria-hidden': 'true' } }, [
      createElement('span', { className: 'metric__marker', vars: { position: `${metric.position}%` } }),
    ]),
    showCaption ? createElement('p', { className: 'metric__caption', text: metric.caption }) : null,
  ]);
}

/**
 * The metric list.
 * @param {ReadonlyArray<object>} metrics from passport-model buildMetrics
 * @param {{showCaption?:boolean, className?:string}} [options]
 * @returns {HTMLUListElement}
 */
export function createMetricBars(metrics, options = {}) {
  const list = createElement('ul', { className: ['metrics', options.className].filter(Boolean).join(' ') });
  list.append(...metrics.map((metric) => createMetricRow(metric, options.showCaption !== false)));
  return list;
}
