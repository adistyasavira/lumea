/**
 * LUMÉA — Journal articles. Written for LUMÉA in Indonesian from the sources listed
 * under each article (opened and read on 17 November 2026). Dates are ISO strings.
 * `image` is the news photo (16:9) in ./assets/journal/, in the same order as the
 * articles; `cover` is the article palette, shown when the photo is missing.
 */

const source = (title, publisher, date, url) => Object.freeze({ title, publisher, date, url });

/**
 * Freezes an article and its nested lists.
 * @param {object} spec
 * @returns {Readonly<object>}
 */
function defineArticle(spec) {
  return Object.freeze({
    ...spec,
    cover: Object.freeze(spec.cover),
    keyPoints: Object.freeze(spec.keyPoints),
    sections: Object.freeze(spec.sections.map((section) => Object.freeze({ ...section, paragraphs: Object.freeze(section.paragraphs) }))),
    sources: Object.freeze(spec.sources),
  });
}

const TREND_ARTICLE = defineArticle({
  id: 'tren-personal-color-2026',
  category: 'Tren',
  title: 'Dari TikTok ke booth kampus: kenapa personal color masih ramai di 2026',
  publishedAt: '2026-11-17',
  readMinutes: 4,
  cover: ['#C25A3A', '#F6B89A', '#6F849C', '#1F2A55'],
  image: './assets/journal/artikel-1.jpg',
  summary: 'Analisis warna personal sudah keluar dari studio Seoul dan masuk ke mal, pop-up, sampai booth kampus di Indonesia. Pembedanya sekarang bukan lagi siapa yang punya filter paling viral, tetapi siapa yang mengukur dengan cahaya terkontrol.',
  keyPoints: [
    'Sistem 4 season dari era 1980-an kini dipecah ke 12 sub-season atau lebih agar lebih presisi.',
    'Korea dan Jepang memopulerkan analisis warna sebagai pengalaman, termasuk kios di pusat belanja.',
    'Filter AI dan media sosial dinilai kurang akurat karena cahaya buatan dan makeup mengubah warna kulit di kamera.',
    'Di Indonesia, booth analisis warna mulai hadir di mal dan acara brand, dan pengunjung berhijab pun ikut mencoba.',
  ],
  sections: [
    {
      heading: 'Bukan sekadar warna favorit',
      paragraphs: [
        'Koran Jakarta (22 Juni 2025) mencatat analisis warna kembali viral lewat TikTok dan Instagram. Sistem empat musim yang dipopulerkan buku Color Me Beautiful di tahun 1980-an kini berkembang menjadi belasan sub-season seperti Soft Autumn, Deep Winter, dan Cool Summer.',
        'Artikel yang sama menyebut Korea Selatan dan Jepang sebagai pusat tren ini, dengan layanan di studio sampai kios warna di pusat belanja. Analisis warna berubah dari konsultasi privat menjadi pengalaman yang bisa dicoba dalam hitungan menit.',
      ],
    },
    {
      heading: 'Kenapa filter saja tidak cukup',
      paragraphs: [
        'Suara Surabaya (9 Februari 2026) menekankan bahwa metode yang dipakai konsultan adalah drape kain berwarna di bawah wajah tanpa makeup. Filter AI dan media sosial dinilai kurang akurat karena pencahayaan buatan dan makeup menggeser warna kulit di kamera.',
        'Itulah alasan LUMÉA memakai ring light daylight, kartu abu-abu sebagai referensi, dan indikator kualitas foto sebelum analisis berjalan. Kamera hanya bisa jujur kalau cahayanya jujur.',
      ],
    },
    {
      heading: 'Wajah Asia butuh detail yang lebih halus',
      paragraphs: [
        'Dalam wawancara dengan Hypebae (12 November 2025), stylist Julianna Lee menyebut sistem season awalnya dirancang untuk fitur wajah Kaukasia. Banyak kliennya dari Asia Timur punya pola kontras yang mirip, yaitu rambut gelap dan kulit lebih terang, sehingga pembeda kecil seperti undertone dan kejernihan warna menjadi penentu.',
        'Di Yogyakarta, detikHealth (4 Oktober 2026) melaporkan booth analisis warna di sebuah mal ramai dikunjungi. Seorang peserta berhijab terkejut ketika warna peach cerah yang selama ini ia hindari justru paling cocok untuknya.',
      ],
    },
  ],
  sources: [
    source('Bukan Cuma Warna Favorit, Tren Color Analysis Kini Makin Ngehits!', 'Koran Jakarta', '2025-06-22', 'https://koran-jakarta.com/2025-06-22/bukan-cuma-warna-favorit-tren-color-analysis-kini-makin-ngehits'),
    source('Tren Personal Color: Salah Pilih Warna, Penampilan Bisa Turun', 'Suara Surabaya', '2026-02-09', 'https://www.suarasurabaya.net/senggang/2026/tren-personal-color-salah-pilih-warna-penampilan-bisa-turun/'),
    source('Wawancara Eksklusif dengan Stylist Online Julianna Lee', 'Hypebae', '2025-11-12', 'https://hypebae.com/id/2025/11/style-beauty-analysis-expert-julianna-lee-tiktok-instagram-interview'),
    source('Ibu-ibu Jogja Antusias Coba Personal Color Analysis dari Frisian Flag', 'detikHealth', '2026-10-04', 'https://health.detik.com/berita-detikhealth/d-8691912/ibu-ibu-jogja-antusias-coba-personal-color-analysis-dari-frisian-flag'),
  ],
});

const MAKEUP_ARTICLE = defineArticle({
  id: 'palette-makeup-tanpa-salah-beli',
  category: 'Makeup',
  title: 'Berhenti salah beli shade: palette pribadi untuk foundation, blush, dan lipstik',
  publishedAt: '2026-11-17',
  readMinutes: 5,
  cover: ['#E39A84', '#B94A6E', '#D79C84', '#8C2F22'],
  image: './assets/journal/artikel-2.jpg',
  summary: 'Kesalahan paling mahal di meja rias biasanya bukan merek, tetapi undertone. Kenali arah warna kulitmu dulu, baru pilih kedalaman shade.',
  keyPoints: [
    'Foundation adalah fondasi: cocokkan undertone terlebih dahulu, baru kedalaman warna.',
    'Kesalahan paling umum adalah foundation yang terlalu warm atau terlalu cool untuk kulit.',
    'Lipstik adalah titik mulai termudah untuk mencoba palette season-mu.',
    'Cek warna di cahaya alami, dan cocokkan foundation ke area dada/leher, bukan pergelangan tangan.',
  ],
  sections: [
    {
      heading: 'Undertone dulu, baru nomor shade',
      paragraphs: [
        'Fashion Quarterly (4 Maret 2026) mewawancarai konsultan warna Georgette Pollock-Johnston yang menyebut foundation sebagai fondasi seluruh tampilan. Kesalahan yang paling sering ia temui adalah foundation dengan undertone yang terlalu hangat atau terlalu sejuk, sehingga wajah tampak oranye atau abu-abu.',
        'Di Color Passport LUMÉA, arah undertone ditulis sebagai Warm, Neutral, atau Cool. Cocokkan dengan kode di kemasan foundation: banyak merek lokal memakai huruf W, N, dan C atau istilah seperti golden, olive, dan rosy.',
      ],
    },
    {
      heading: 'Blush dan lipstik per season',
      paragraphs: [
        'Panduan L\'Oréal Paris (1 September 2025) memetakan warna makeup per musim: Spring cocok dengan peach, koral, dan emas hangat; Summer dengan pink lembut, lavender, dan warna berintensitas rendah; Autumn dengan nuansa bata dan nude hangat; Winter dengan fuchsia, merah kebiruan, dan emerald.',
        'Fashion Quarterly menambahkan bahwa lipstik adalah tempat paling aman untuk mulai bereksperimen. Jika ingin memakai warna di luar palette, imbangi dengan blush yang sesuai season-mu.',
      ],
    },
    {
      heading: 'Di mana dan di cahaya apa',
      paragraphs: [
        'Beautiful With Brains (diperbarui 18 Juni 2025) mengingatkan agar tidak mencocokkan foundation di pergelangan tangan, yang biasanya lebih pucat dan lebih kuning dari wajah. Mencocokkan di rahang saja juga bisa membuat efek topeng; area dada dan leher lebih aman.',
        'Kedua sumber sepakat soal cahaya: cek di dekat jendela, bukan di bawah lampu toko. Prinsip yang sama berlaku di booth LUMÉA, karena ring light daylight meniru cahaya siang yang netral.',
      ],
    },
  ],
  sources: [
    source('The shade shift: How colour analysis is changing how we wear make-up', 'Fashion Quarterly', '2026-03-04', 'https://fq.co.nz/how-colour-analysis-is-changing-how-we-wear-make-up/'),
    source('How Seasonal Color Analysis Can Help You Find Your Most Flattering Makeup', "L'Oréal Paris", '2025-09-01', 'https://www.lorealparisusa.com/beauty-magazine/makeup/makeup-trends/color-analysis-for-makeup'),
    source('Where Should You Match Your Foundation?', 'Beautiful With Brains', '2025-06-18', 'https://www.beautifulwithbrains.com/where-should-you-match-your-foundation/'),
  ],
});

const JEWELRY_ARTICLE = defineArticle({
  id: 'emas-rose-gold-silver',
  category: 'Perhiasan',
  title: 'Emas kuning, rose gold, atau silver? Biarkan undertone yang memilih',
  publishedAt: '2026-11-17',
  readMinutes: 4,
  cover: ['#D4AF37', '#B76E79', '#C0C0C0', '#2C2825'],
  image: './assets/journal/artikel-3.jpg',
  summary: 'Logam yang tepat memantulkan cahaya hangat atau sejuk ke wajah. Pilihan yang salah tidak merusak gaya, tetapi membuat kulit tampak kurang segar.',
  keyPoints: [
    'Undertone hangat (keemasan, peach) cenderung bersinar dengan emas kuning.',
    'Undertone sejuk (pink, kemerahan) lebih cerah dengan silver, emas putih, atau platinum.',
    'Undertone netral bisa mencampur logam, dan rose gold sering menjadi jembatan.',
    'Tes urat nadi tidak bisa diandalkan; bandingkan logam langsung di dekat wajah.',
  ],
  sections: [
    {
      heading: 'Aturan dasarnya sederhana',
      paragraphs: [
        'Pulse Nigeria (3 April 2025) merangkum aturan yang dipakai banyak stylist: kulit dengan rona keemasan, kuning, atau peach cocok dengan emas, sedangkan kulit dengan rona pink, merah, atau kebiruan cocok dengan silver. Kulit netral punya keleluasaan untuk mencampur keduanya, misalnya gelang emas dengan cincin silver.',
        'Suara Surabaya (9 Februari 2026) juga menyebut tes emas versus silver sebagai salah satu cara cepat membaca undertone saat analisis warna.',
      ],
    },
    {
      heading: 'Lupakan tes urat nadi',
      paragraphs: [
        'Imogen Lamport dari Inside Out Style (23 Juni 2026) menjelaskan bahwa warna urat di pergelangan tangan dipengaruhi ketebalan kulit, sehingga tidak bisa dijadikan patokan undertone. Cara yang lebih jujur adalah membandingkan langsung di dekat wajah.',
        'Coba di depan jendela: pegang kalung emas lalu silver tepat di bawah dagu. Logam yang tepat membuat kulit tampak merata dan bercahaya; logam yang kurang tepat membuat bayangan di bawah mata lebih terlihat.',
      ],
    },
    {
      heading: 'Membaca Color Passport-mu',
      paragraphs: [
        'Passport LUMÉA mengurutkan tiga logam dari yang paling cocok. Season Spring dan Autumn biasanya diawali emas kuning, perunggu, atau tembaga. Summer dan Winter diawali silver, emas putih, atau platinum.',
        'Rose gold sering muncul sebagai pilihan kedua untuk season dengan undertone netral-hangat, karena rona pink-keemasannya menjembatani dua arah.',
      ],
    },
  ],
  sources: [
    source('How to Pick the Right Jewelry for Your Skin Tone', 'Pulse Nigeria', '2025-04-03', 'https://www.pulse.ng/story/how-to-pick-the-right-jewelry-for-your-skin-tone-2025040315443577940'),
    source('Tren Personal Color: Salah Pilih Warna, Penampilan Bisa Turun', 'Suara Surabaya', '2026-02-09', 'https://www.suarasurabaya.net/senggang/2026/tren-personal-color-salah-pilih-warna-penampilan-bisa-turun/'),
    source("What Colours Actually Look Best on You? (Here's What the Science Says)", 'Inside Out Style', '2026-06-23', 'https://insideoutstyleblog.com/2026/06/what-colours-actually-look-best-on-you-heres-what-the-science-says.html'),
  ],
});

const OUTFIT_ARTICLE = defineArticle({
  id: 'warna-outfit-wajah-cerah',
  category: 'Outfit',
  title: 'Warna terbaik di dekat wajah: strategi outfit harian agar tampak lebih cerah',
  publishedAt: '2026-11-17',
  readMinutes: 5,
  cover: ['#1F5C5A', '#EFE3CC', '#9C3F24', '#7FA1C9'],
  image: './assets/journal/artikel-4.jpg',
  summary: 'Warna yang paling dekat dengan wajah, seperti atasan, kerah, hijab, dan scarf, bekerja paling keras. Taruh warna terbaikmu di sana dan simpan warna yang kurang cocok untuk bawahan.',
  keyPoints: [
    'Nilai warna dari tiga sisi: undertone, value (terang-gelap), dan chroma (jernih-redup).',
    'Kontras outfit sebaiknya mengikuti kontras wajah: rambut, kulit, dan mata.',
    'Riset persepsi menunjukkan warna kulit yang tampak merata dinilai lebih sehat.',
    'Warna yang dihindari tetap bisa dipakai, asalkan jauh dari wajah.',
  ],
  sections: [
    {
      heading: 'Tiga dimensi, bukan hanya hangat-sejuk',
      paragraphs: [
        'Inside Out Style (23 Juni 2026) membagi penilaian warna menjadi tiga dimensi: undertone, value atau tingkat terang-gelap, dan chroma atau kejernihan. Kontras yang dimaksud adalah selisih terang-gelap antara rambut, kulit, dan mata, bukan seberapa terang kulit saja.',
        'Artikel itu merujuk penelitian Stephen dkk. (2012, PLOS ONE) bahwa kulit dengan warna yang merata dipersepsikan lebih sehat, serta riset Richard Russell dari Tufts University tentang kontras wajah sebagai sinyal kesehatan. Warna pakaian yang tepat membantu kulit tampak lebih merata.',
      ],
    },
    {
      heading: 'Aturan zona wajah',
      paragraphs: [
        'Letakkan warna terbaik dari passport-mu di area yang paling dekat dengan wajah: atasan, kerah, hijab, dan scarf. Warna dari daftar Hindari tidak perlu dibuang dari lemari; pindahkan ke celana, rok, tas, atau sepatu.',
        'Pengalaman peserta di detikHealth (4 Oktober 2026) menggambarkan efeknya: warna muted yang biasa ia pakai membuat wajahnya tampak lebih gelap, sedangkan warna yang sesuai season-nya membuat wajahnya tampak lebih segar.',
      ],
    },
    {
      heading: 'Samakan kontras outfit dengan kontras wajah',
      paragraphs: [
        'Jika kontras wajahmu tinggi, misalnya rambut dan alis hitam dengan kulit cerah, padukan warna gelap dan terang dengan tegas seperti navy dengan putih. Jika kontrasmu rendah, pilih kombinasi bernada dekat seperti taupe dengan oat.',
        'Color Passport LUMÉA sudah memuat tiga formula outfit siap pakai dengan urutan atasan, bawahan, dan aksen sesuai kontras yang terukur di booth.',
      ],
    },
  ],
  sources: [
    source("What Colours Actually Look Best on You? (Here's What the Science Says)", 'Inside Out Style', '2026-06-23', 'https://insideoutstyleblog.com/2026/06/what-colours-actually-look-best-on-you-heres-what-the-science-says.html'),
    source('Ibu-ibu Jogja Antusias Coba Personal Color Analysis dari Frisian Flag', 'detikHealth', '2026-10-04', 'https://health.detik.com/berita-detikhealth/d-8691912/ibu-ibu-jogja-antusias-coba-personal-color-analysis-dari-frisian-flag'),
  ],
});

/** All Journal articles, newest first. */
export const JOURNAL_ARTICLES = Object.freeze([TREND_ARTICLE, MAKEUP_ARTICLE, JEWELRY_ARTICLE, OUTFIT_ARTICLE]);

/**
 * Finds an article by id.
 * @param {string} articleId
 * @returns {Readonly<object>|null}
 */
export function getArticleById(articleId) {
  return JOURNAL_ARTICLES.find((article) => article.id === articleId) ?? null;
}
