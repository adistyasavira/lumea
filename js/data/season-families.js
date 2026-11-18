/**
 * LUMÉA — The four season families that group the 12 sub-seasons on The Palettes
 * page and in the booth recap. Sub-season details live in seasons.js.
 */
import { SEASONS } from './seasons.js';

const defineFamily = (spec) => Object.freeze({ ...spec, signature: Object.freeze(spec.signature) });

/** Families in wheel order. `name` matches the `family` field of each season. */
export const SEASON_FAMILIES = Object.freeze([
  defineFamily({
    name: 'Spring',
    traits: 'Warm • Light • Clear',
    description: 'Spring colors are luminous, warm, and radiant. Inspired by blooming blossoms, warm golden sunlight, and fresh greenery. They illuminate skins with golden or peachy undertones.',
    signature: ['#E07A5F', '#F4A261', '#E9C46A', '#2A9D8F', '#F7F4EA'],
  }),
  defineFamily({
    name: 'Summer',
    traits: 'Cool • Light • Soft',
    description: 'Summer shades are muted, cool, and soft like sea mist and lavender fields. Gentle blues, powdery pinks, and dusty slates soothe and complement delicate cool skin undertones.',
    signature: ['#D8A49B', '#B8A3BA', '#8E9AAF', '#9A9E8F', '#EFD3D7'],
  }),
  defineFamily({
    name: 'Autumn',
    traits: 'Warm • Deep • Soft',
    description: 'Autumn colors bring depth, warmth, and grounded richness. Terracotta, burnt amber, olive green, and warm espresso create an effortless sophisticated atmosphere for warm rich complexions.',
    signature: ['#C85A32', '#828A5D', '#B35629', '#DBA159', '#4A3525'],
  }),
  defineFamily({
    name: 'Winter',
    traits: 'Cool • Deep • Clear',
    description: 'Winter colors possess high clarity, deep intensity, and striking contrast. Vivid emeralds, royal blue, deep ruby, and obsidian black bring high-fashion distinction to cool high-contrast skin.',
    signature: ['#1D3557', '#E63946', '#1B4332', '#9B5DE5', '#1A1817'],
  }),
]);

/**
 * The sub-seasons of one family, in wheel order.
 * @param {string} familyName
 * @returns {ReadonlyArray<object>}
 */
export function getSeasonsOfFamily(familyName) {
  return SEASONS.filter((season) => season.family === familyName);
}
