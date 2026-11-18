/**
 * LUMÉA — The 12 seasons. Single source of truth for prototypes, palettes, colours to
 * avoid, makeup, jewellery metals and outfit formulas.
 *
 * prototype: position on the four normalised axes (−1…+1):
 *   undertone (cool → warm), lightness (deep → light), chroma (soft → clear), contrast (low → high).
 * outfits: indices into `palette`, ordered [top, bottom, accent].
 */

const swatch = (name, hex) => Object.freeze({ name, hex });

/**
 * Freezes a season definition and its nested lists.
 * @param {object} spec
 * @returns {Readonly<object>}
 */
function defineSeason(spec) {
  return Object.freeze({
    ...spec,
    prototype: Object.freeze(spec.prototype),
    palette: Object.freeze(spec.palette),
    avoid: Object.freeze(spec.avoid),
    makeup: Object.freeze({ ...spec.makeup, blush: Object.freeze(spec.makeup.blush), lip: Object.freeze(spec.makeup.lip) }),
    metals: Object.freeze(spec.metals),
    outfits: Object.freeze(spec.outfits.map((outfit) => Object.freeze({ ...outfit, items: Object.freeze(outfit.items) }))),
  });
}

const LIGHT_SPRING = defineSeason({
  id: 'light-spring',
  name: 'Light Spring',
  family: 'Spring',
  tagline: 'Hangat, terang, dan segar',
  description: 'Kulitmu terang dengan rona hangat lembut dan kontras rendah. Warna muda yang jernih membuat wajah tampak cerah tanpa tenggelam.',
  prototype: { undertone: 0.4, lightness: 0.8, chroma: 0.2, contrast: -0.5 },
  palette: [
    swatch('Peach', '#F6B89A'), swatch('Coral Muda', '#F28C7C'), swatch('Butter', '#F6E3A1'), swatch('Ivory Hangat', '#FAF0DC'),
    swatch('Mint Hangat', '#A8D8B9'), swatch('Aqua Muda', '#7FCFC9'), swatch('Periwinkle', '#9FB3E0'), swatch('Camel Muda', '#D9B68A'),
    swatch('Salmon', '#F4A3A0'), swatch('Kuning Lembut', '#F2CF6B'), swatch('Abu Hangat', '#CFC6BA'), swatch('Turquoise', '#4FB8B0'),
  ],
  avoid: [swatch('Hitam Pekat', '#1A1A1A'), swatch('Burgundi', '#6D1F2F'), swatch('Charcoal', '#36393F'), swatch('Mauve Kusam', '#8E6E7E')],
  makeup: {
    foundation: 'Label Warm atau Neutral, rentang terang. Hindari shade berlabel Pink/Cool yang membuat wajah abu.',
    blush: [swatch('Peach', '#F3A88C'), swatch('Coral', '#EE8F7B'), swatch('Apricot', '#F2B07E')],
    lip: [swatch('Peach Nude', '#E39A84'), swatch('Coral', '#E46F5F'), swatch('Warm Pink', '#E3787F')],
  },
  metals: ['Emas kuning muda', 'Rose gold', 'Emas champagne'],
  outfits: [
    { name: 'Kuliah pagi', items: [0, 7, 11] },
    { name: 'Presentasi', items: [3, 6, 1] },
    { name: 'Akhir pekan', items: [4, 2, 8] },
  ],
});

const WARM_SPRING = defineSeason({
  id: 'warm-spring',
  name: 'Warm Spring',
  family: 'Spring',
  tagline: 'Hangat, cerah, dan berenergi',
  description: 'Undertone-mu jelas keemasan. Warna hangat yang jernih seperti koral dan kuning emas menghidupkan rona alami kulitmu.',
  prototype: { undertone: 0.9, lightness: 0.4, chroma: 0.5, contrast: 0 },
  palette: [
    swatch('Kuning Emas', '#F4C04E'), swatch('Koral Hangat', '#EE7B5B'), swatch('Apricot', '#F5A26B'), swatch('Peach', '#F7B98F'),
    swatch('Hijau Daun', '#7BBF5A'), swatch('Teal Hangat', '#2FA99A'), swatch('Camel', '#C9925A'), swatch('Krem', '#F8EDD3'),
    swatch('Tomat', '#E8533A'), swatch('Cokelat Emas', '#A86A2F'), swatch('Aqua Hangat', '#5EC2B5'), swatch('Periwinkle Hangat', '#7E8FD0'),
  ],
  avoid: [swatch('Hitam', '#121212'), swatch('Burgundi Dingin', '#5E1B33'), swatch('Abu Kebiruan', '#8C97A3'), swatch('Fuchsia', '#C2187A')],
  makeup: {
    foundation: 'Label Warm, Golden, atau Yellow di rentang terang-sedang.',
    blush: [swatch('Apricot', '#F2A273'), swatch('Peach', '#F3AE8E'), swatch('Koral Hangat', '#EC8264')],
    lip: [swatch('Koral', '#E1694F'), swatch('Terracotta Muda', '#D46A4A'), swatch('Peach Nude', '#DE9479')],
  },
  metals: ['Emas kuning', 'Kuningan', 'Rose gold'],
  outfits: [
    { name: 'Kuliah pagi', items: [7, 6, 1] },
    { name: 'Presentasi', items: [5, 9, 0] },
    { name: 'Akhir pekan', items: [2, 7, 4] },
  ],
});

const BRIGHT_SPRING = defineSeason({
  id: 'bright-spring',
  name: 'Bright Spring',
  family: 'Spring',
  tagline: 'Jernih, cerah, dan kontras',
  description: 'Kontras wajahmu tinggi dengan rona hangat. Warna yang tegas dan bersih menyamai energi wajahmu; warna kusam membuatnya tampak lelah.',
  prototype: { undertone: 0.4, lightness: 0.1, chroma: 0.9, contrast: 0.6 },
  palette: [
    swatch('Merah Koral', '#F4574B'), swatch('Pink Hangat', '#F06A8A'), swatch('Turquoise Cerah', '#12B5AE'), swatch('Hijau Kelly', '#2DAF5A'),
    swatch('Kuning Cerah', '#F7C832'), swatch('Aqua Jernih', '#2EC4D3'), swatch('Periwinkle Royal', '#5D6FD6'), swatch('Ivory Hangat', '#FBF3E2'),
    swatch('Oranye Poppy', '#F57B3A'), swatch('Violet', '#8C5CC9'), swatch('Navy Cerah', '#24407A'), swatch('Koral Terang', '#FF6F61'),
  ],
  avoid: [swatch('Dusty Rose', '#C9A0A0'), swatch('Taupe', '#8B7D6B'), swatch('Olive Kusam', '#6E6B4A'), swatch('Abu Kusam', '#9A9A93')],
  makeup: {
    foundation: 'Label Warm atau Neutral di rentang sedang; pilih hasil akhir natural-glow.',
    blush: [swatch('Koral', '#F27A6A'), swatch('Pink Hangat', '#F1849A'), swatch('Peach Cerah', '#F69C78')],
    lip: [swatch('Merah Koral', '#E9483F'), swatch('Watermelon', '#E85A6E'), swatch('Fuchsia Hangat', '#D9407A')],
  },
  metals: ['Emas kuning mengkilap', 'Rose gold', 'Silver mengkilap'],
  outfits: [
    { name: 'Kuliah pagi', items: [7, 10, 0] },
    { name: 'Presentasi', items: [6, 10, 7] },
    { name: 'Akhir pekan', items: [2, 7, 4] },
  ],
});

const LIGHT_SUMMER = defineSeason({
  id: 'light-summer',
  name: 'Light Summer',
  family: 'Summer',
  tagline: 'Sejuk, terang, dan lembut',
  description: 'Kulitmu terang dengan rona sejuk dan kontras rendah. Warna pastel berlapis abu-abu lembut membuat wajahmu tampak tenang dan bersih.',
  prototype: { undertone: -0.4, lightness: 0.8, chroma: -0.3, contrast: -0.6 },
  palette: [
    swatch('Powder Blue', '#B7CDE3'), swatch('Soft Rose', '#E8B4BC'), swatch('Lavender', '#C7B8DD'), swatch('Periwinkle Muda', '#A9B4DD'),
    swatch('Soft Aqua', '#9ECFCF'), swatch('Mint Sejuk', '#B5DCCB'), swatch('Rose Pink', '#E39AAE'), swatch('Putih Lembut', '#F4F2EE'),
    swatch('Abu Biru', '#A7B3C0'), swatch('Mauve Muda', '#C9A3B6'), swatch('Biru Langit', '#8FB8DE'), swatch('Navy Lembut', '#4D5D7A'),
  ],
  avoid: [swatch('Oranye', '#E86A1C'), swatch('Mustard', '#C99A2E'), swatch('Hitam', '#111111'), swatch('Cokelat Tua Hangat', '#5B3A1E')],
  makeup: {
    foundation: 'Label Cool atau Neutral di rentang terang; undertone pink/rosy lebih menyatu.',
    blush: [swatch('Soft Pink', '#E8A7B5'), swatch('Rose', '#DC8E9E'), swatch('Lilac Pink', '#D9A3C3')],
    lip: [swatch('Rose Nude', '#C98A93'), swatch('Soft Raspberry', '#C5607A'), swatch('Cool Pink', '#DD7E97')],
  },
  metals: ['Silver', 'Emas putih', 'Rose gold muda'],
  outfits: [
    { name: 'Kuliah pagi', items: [0, 7, 6] },
    { name: 'Presentasi', items: [7, 11, 2] },
    { name: 'Akhir pekan', items: [5, 8, 1] },
  ],
});

const COOL_SUMMER = defineSeason({
  id: 'cool-summer',
  name: 'Cool Summer',
  family: 'Summer',
  tagline: 'Sejuk, kalem, dan elegan',
  description: 'Undertone-mu jelas sejuk kemerahan. Warna sejuk dengan intensitas sedang seperti biru keabuan dan raspberry membuat kulitmu tampak merata.',
  prototype: { undertone: -0.9, lightness: 0.3, chroma: -0.3, contrast: -0.2 },
  palette: [
    swatch('Biru Lembut', '#7FA1C9'), swatch('Raspberry Lembut', '#C2557A'), swatch('Rose', '#D98CA3'), swatch('Lavender', '#A99BD0'),
    swatch('Teal Sejuk', '#4F9A9E'), swatch('Spruce', '#4C7A72'), swatch('Abu Biru', '#7D8DA1'), swatch('Plum Muda', '#8C5A80'),
    swatch('Putih Lembut', '#F2F1EE'), swatch('Navy Lembut', '#3E4E6E'), swatch('Cocoa Dingin', '#6E5A5A'), swatch('Mint Biru', '#8FC5C1'),
  ],
  avoid: [swatch('Oranye', '#F27A1A'), swatch('Camel', '#C19A6B'), swatch('Kuning Emas', '#E5B43A'), swatch('Cokelat Hangat', '#7A4A22')],
  makeup: {
    foundation: 'Label Cool atau Neutral di rentang terang-sedang.',
    blush: [swatch('Rose', '#D8879D'), swatch('Berry Lembut', '#C46C88'), swatch('Cool Pink', '#E09AAE')],
    lip: [swatch('Raspberry', '#B94A6E'), swatch('Rose', '#C9788B'), swatch('Berry', '#9E3E62')],
  },
  metals: ['Silver', 'Platinum', 'Emas putih'],
  outfits: [
    { name: 'Kuliah pagi', items: [8, 9, 1] },
    { name: 'Presentasi', items: [0, 9, 8] },
    { name: 'Akhir pekan', items: [2, 6, 4] },
  ],
});

const SOFT_SUMMER = defineSeason({
  id: 'soft-summer',
  name: 'Soft Summer',
  family: 'Summer',
  tagline: 'Sejuk, redup, dan menyatu',
  description: 'Fitur wajahmu menyatu lembut tanpa kontras tajam. Warna berdebu yang sejuk membuatmu tampak rapi; warna neon justru mengalahkan wajahmu.',
  prototype: { undertone: -0.3, lightness: 0, chroma: -0.9, contrast: -0.5 },
  palette: [
    swatch('Dusty Rose', '#C49A9F'), swatch('Sage', '#9AAA94'), swatch('Slate Blue', '#6F849C'), swatch('Soft Teal', '#6E9C98'),
    swatch('Mauve', '#A9879B'), swatch('Lavender Asap', '#9E95B5'), swatch('Abu Lembut', '#A6A6A3'), swatch('Taupe Sejuk', '#8E8279'),
    swatch('Denim', '#5E7894'), swatch('Rose Brown', '#9C6F73'), swatch('Navy Lembut', '#48546B'), swatch('Oyster', '#DCD6CD'),
  ],
  avoid: [swatch('Hitam', '#0F0F0F'), swatch('Oranye Terang', '#FF7A00'), swatch('Fuchsia Neon', '#FF2E9A'), swatch('Putih Bersih', '#FFFFFF')],
  makeup: {
    foundation: 'Label Neutral atau Cool di rentang sedang; hasil akhir satin, bukan glowy.',
    blush: [swatch('Dusty Rose', '#C48E98'), swatch('Soft Mauve', '#B78B9C'), swatch('Muted Pink', '#CF9AA3')],
    lip: [swatch('Rose Brown', '#A86E74'), swatch('Mauve', '#9E6A80'), swatch('Dusty Berry', '#8F5068')],
  },
  metals: ['Silver doff', 'Emas putih', 'Pewter'],
  outfits: [
    { name: 'Kuliah pagi', items: [11, 8, 0] },
    { name: 'Presentasi', items: [2, 10, 11] },
    { name: 'Akhir pekan', items: [1, 7, 4] },
  ],
});

const SOFT_AUTUMN = defineSeason({
  id: 'soft-autumn',
  name: 'Soft Autumn',
  family: 'Autumn',
  tagline: 'Hangat, redup, dan natural',
  description: 'Rona hangatmu lembut dan kontras wajahmu rendah. Warna earthy yang berdebu seperti camel, sage, dan salmon membuat kulitmu tampak hidup.',
  prototype: { undertone: 0.3, lightness: 0, chroma: -0.9, contrast: -0.4 },
  palette: [
    swatch('Camel', '#BE9B73'), swatch('Olive Lembut', '#8C8A5E'), swatch('Salmon Muda', '#D99A82'), swatch('Moss', '#7A8460'),
    swatch('Teal Hangat', '#5F8F86'), swatch('Taupe Hangat', '#9B8470'), swatch('Peach Berdebu', '#DDA88E'), swatch('Khaki', '#B8AB84'),
    swatch('Terracotta Lembut', '#B9765B'), swatch('Cokelat Susu', '#8A6A52'), swatch('Oat', '#E3D6BF'), swatch('Jade Kusam', '#6F9A86'),
  ],
  avoid: [swatch('Hitam', '#101010'), swatch('Fuchsia', '#D1157C'), swatch('Biru Elektrik', '#1F5BFF'), swatch('Putih Bersih', '#FFFFFF')],
  makeup: {
    foundation: 'Label Neutral, Olive, atau Warm di rentang sedang.',
    blush: [swatch('Soft Peach', '#D79C84'), swatch('Terracotta Lembut', '#C47E68'), swatch('Rosy Brown', '#B98275')],
    lip: [swatch('Nude Hangat', '#B07A65'), swatch('Brick Lembut', '#A55E4C'), swatch('Rosy Brown', '#A06A64')],
  },
  metals: ['Emas doff', 'Perunggu', 'Rose gold doff'],
  outfits: [
    { name: 'Kuliah pagi', items: [10, 9, 2] },
    { name: 'Presentasi', items: [0, 9, 10] },
    { name: 'Akhir pekan', items: [11, 7, 8] },
  ],
});

const WARM_AUTUMN = defineSeason({
  id: 'warm-autumn',
  name: 'Warm Autumn',
  family: 'Autumn',
  tagline: 'Hangat, kaya, dan membumi',
  description: 'Undertone-mu keemasan dan kedalamanmu sedang. Warna rempah seperti terracotta, mustard, dan olive menyatu sempurna dengan kulitmu.',
  prototype: { undertone: 0.9, lightness: -0.3, chroma: 0, contrast: 0.1 },
  palette: [
    swatch('Terracotta', '#C25A3A'), swatch('Mustard', '#D39B2A'), swatch('Olive', '#6E6B2F'), swatch('Rust', '#A9472A'),
    swatch('Labu', '#E07A2E'), swatch('Teal Hangat', '#2E7A72'), swatch('Camel', '#B8854F'), swatch('Cokelat', '#5B3A24'),
    swatch('Hijau Hutan Hangat', '#3F5A33'), swatch('Krem', '#F1E4C8'), swatch('Tomat Hangat', '#C84B31'), swatch('Bronze', '#9C6A2E'),
  ],
  avoid: [swatch('Pink Dingin', '#F2A1C7'), swatch('Biru Es', '#BFE3F5'), swatch('Abu Dingin', '#A3A9B3'), swatch('Fuchsia', '#C2187A')],
  makeup: {
    foundation: 'Label Warm atau Golden di rentang sedang-gelap.',
    blush: [swatch('Terracotta', '#C4684C'), swatch('Burnt Peach', '#D07C5A'), swatch('Bronze', '#A86A45')],
    lip: [swatch('Brick', '#9E3E2A'), swatch('Terracotta', '#B5523A'), swatch('Cinnamon', '#A0563B')],
  },
  metals: ['Emas kuning', 'Perunggu', 'Tembaga'],
  outfits: [
    { name: 'Kuliah pagi', items: [9, 6, 0] },
    { name: 'Presentasi', items: [5, 7, 9] },
    { name: 'Akhir pekan', items: [1, 2, 3] },
  ],
});

const DEEP_AUTUMN = defineSeason({
  id: 'deep-autumn',
  name: 'Deep Autumn',
  family: 'Autumn',
  tagline: 'Dalam, hangat, dan tegas',
  description: 'Kulit dan fitur wajahmu dalam dengan kontras tinggi dan rona hangat. Warna gelap yang kaya seperti espresso, petrol, dan rust membuatmu tampak berwibawa.',
  prototype: { undertone: 0.4, lightness: -0.8, chroma: 0, contrast: 0.7 },
  palette: [
    swatch('Espresso', '#3E2A20'), swatch('Burgundi Hangat', '#7A2632'), swatch('Deep Teal', '#1F5C5A'), swatch('Hijau Hutan', '#2F4A2B'),
    swatch('Rust', '#9C3F24'), swatch('Mustard Gelap', '#B5832A'), swatch('Aubergine Hangat', '#4F2D3A'), swatch('Olive Gelap', '#545224'),
    swatch('Tomat Gelap', '#B23A27'), swatch('Petrol', '#1E4A5C'), swatch('Camel Gelap', '#9A6B3C'), swatch('Ivory Hangat', '#EFE3CC'),
  ],
  avoid: [swatch('Pink Pastel', '#F7C6D9'), swatch('Baby Blue', '#BFDDF2'), swatch('Lavender', '#CDBBE6'), swatch('Abu Muda Dingin', '#C9CDD3')],
  makeup: {
    foundation: 'Label Warm atau Neutral di rentang gelap; cari undertone golden-olive.',
    blush: [swatch('Brick Rose', '#A65A4E'), swatch('Bronze', '#9A5E3E'), swatch('Deep Peach', '#C0704F')],
    lip: [swatch('Brick', '#8C2F22'), swatch('Wine Hangat', '#6E2230'), swatch('Cokelat Merah', '#7D3B2A')],
  },
  metals: ['Emas antik', 'Perunggu', 'Tembaga gelap'],
  outfits: [
    { name: 'Kuliah pagi', items: [11, 0, 4] },
    { name: 'Presentasi', items: [11, 9, 1] },
    { name: 'Akhir pekan', items: [5, 3, 0] },
  ],
});

const DEEP_WINTER = defineSeason({
  id: 'deep-winter',
  name: 'Deep Winter',
  family: 'Winter',
  tagline: 'Dalam, sejuk, dan dramatis',
  description: 'Fitur wajahmu gelap dan kontras dengan rona netral-sejuk. Warna permata yang gelap dan jernih membuat wajahmu tampak tajam dan segar.',
  prototype: { undertone: -0.4, lightness: -0.8, chroma: 0.3, contrast: 0.8 },
  palette: [
    swatch('Hitam Lembut', '#1C1C1F'), swatch('Navy', '#1F2A55'), swatch('Emerald', '#0E6B4F'), swatch('Burgundi', '#6B1530'),
    swatch('Ruby', '#A3123A'), swatch('Plum', '#5A2257'), swatch('Pine', '#1E4D3A'), swatch('Putih Es', '#F4F6F8'),
    swatch('Royal Blue', '#2843A6'), swatch('Charcoal', '#3A3B40'), swatch('Deep Teal', '#10565E'), swatch('Berry', '#8E1F57'),
  ],
  avoid: [swatch('Oranye', '#F28C28'), swatch('Camel', '#C9A27A'), swatch('Peach', '#F5B99A'), swatch('Mustard', '#D4A12A')],
  makeup: {
    foundation: 'Label Neutral atau Cool di rentang gelap.',
    blush: [swatch('Berry', '#A33E62'), swatch('Plum Rose', '#8E4566'), swatch('Deep Rose', '#B04F6A')],
    lip: [swatch('Ruby', '#8E1530'), swatch('Wine', '#5E1530'), swatch('Plum', '#6A2147')],
  },
  metals: ['Silver', 'Platinum', 'Emas putih'],
  outfits: [
    { name: 'Kuliah pagi', items: [7, 1, 4] },
    { name: 'Presentasi', items: [7, 0, 2] },
    { name: 'Akhir pekan', items: [10, 9, 11] },
  ],
});

const COOL_WINTER = defineSeason({
  id: 'cool-winter',
  name: 'Cool Winter',
  family: 'Winter',
  tagline: 'Sejuk, jernih, dan tegas',
  description: 'Undertone-mu jelas sejuk dan kontras wajahmu tinggi. Warna sejuk yang jernih seperti sapphire dan merah kebiruan menonjolkan kecerahan kulitmu.',
  prototype: { undertone: -0.9, lightness: -0.3, chroma: 0.6, contrast: 0.8 },
  palette: [
    swatch('Merah Kebiruan', '#C8102E'), swatch('Pink Es', '#F3D3E3'), swatch('Royal Blue', '#1F4FBF'), swatch('Emerald', '#009473'),
    swatch('Fuchsia', '#C2187A'), swatch('Biru Es', '#D6E8F5'), swatch('Hitam', '#121212'), swatch('Putih Murni', '#FAFAFA'),
    swatch('Sapphire', '#0F3B82'), swatch('Magenta', '#A0185E'), swatch('Charcoal Sejuk', '#3A3F47'), swatch('Lavender Es', '#E2DAF2'),
  ],
  avoid: [swatch('Oranye', '#F28C28'), swatch('Camel', '#C9A27A'), swatch('Olive', '#7A7A3A'), swatch('Cokelat Hangat', '#7A4A22')],
  makeup: {
    foundation: 'Label Cool atau Neutral di rentang sedang.',
    blush: [swatch('Cool Pink', '#E07BA2'), swatch('Fuchsia Lembut', '#D4609A'), swatch('Berry', '#B04470')],
    lip: [swatch('Blue Red', '#B3122E'), swatch('Fuchsia', '#C0186E'), swatch('Berry', '#8E1F57')],
  },
  metals: ['Silver', 'Platinum', 'Emas putih'],
  outfits: [
    { name: 'Kuliah pagi', items: [7, 8, 0] },
    { name: 'Presentasi', items: [5, 10, 4] },
    { name: 'Akhir pekan', items: [1, 6, 3] },
  ],
});

const BRIGHT_WINTER = defineSeason({
  id: 'bright-winter',
  name: 'Bright Winter',
  family: 'Winter',
  tagline: 'Jernih, sejuk, dan berani',
  description: 'Kontras wajahmu sangat tinggi dan warnamu jernih. Warna saturasi tinggi seperti hot pink, electric blue, dan emerald adalah wilayahmu.',
  prototype: { undertone: -0.4, lightness: 0, chroma: 0.9, contrast: 0.9 },
  palette: [
    swatch('Hot Pink', '#E6007E'), swatch('Electric Blue', '#1E5BFF'), swatch('Emerald Cerah', '#00A36C'), swatch('Lemon Es', '#F5F18A'),
    swatch('Merah Murni', '#D2042D'), swatch('Putih Es', '#F7F9FB'), swatch('Hitam', '#101010'), swatch('Violet Cerah', '#7A2FD0'),
    swatch('Turquoise Sejuk', '#00A6B4'), swatch('Navy Royal', '#1A2A6C'), swatch('Mint Es', '#CFF3E6'), swatch('Magenta', '#C2008A'),
  ],
  avoid: [swatch('Camel', '#C9A27A'), swatch('Olive', '#7A7A3A'), swatch('Mauve Kusam', '#A3858E'), swatch('Oranye Karat', '#B5592A')],
  makeup: {
    foundation: 'Label Neutral atau Cool di rentang sedang.',
    blush: [swatch('Bright Pink', '#F06A9A'), swatch('Raspberry', '#D63F6E'), swatch('Fuchsia Lembut', '#E25E9E')],
    lip: [swatch('Merah Murni', '#C8102E'), swatch('Hot Pink', '#D9006C'), swatch('Raspberry', '#B0144F')],
  },
  metals: ['Silver mengkilap', 'Platinum', 'Emas putih'],
  outfits: [
    { name: 'Kuliah pagi', items: [5, 9, 0] },
    { name: 'Presentasi', items: [5, 6, 4] },
    { name: 'Akhir pekan', items: [8, 5, 7] },
  ],
});

/** All seasons in wheel order. */
export const SEASONS = Object.freeze([
  LIGHT_SPRING, WARM_SPRING, BRIGHT_SPRING,
  LIGHT_SUMMER, COOL_SUMMER, SOFT_SUMMER,
  SOFT_AUTUMN, WARM_AUTUMN, DEEP_AUTUMN,
  DEEP_WINTER, COOL_WINTER, BRIGHT_WINTER,
]);

const SEASONS_BY_ID = new Map(SEASONS.map((season) => [season.id, season]));

/**
 * Finds a season by id.
 * @param {string} seasonId
 * @returns {Readonly<object>|null}
 */
export function getSeasonById(seasonId) {
  return SEASONS_BY_ID.get(seasonId) ?? null;
}

/**
 * Resolves an outfit's palette indices into swatches.
 * @param {Readonly<object>} season
 * @param {{items:ReadonlyArray<number>}} outfit
 * @returns {Array<{name:string, hex:string}>}
 */
export function resolveOutfitSwatches(season, outfit) {
  return outfit.items.map((index) => season.palette[index]);
}
