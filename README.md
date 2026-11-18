# LUMÉA — Personal Color Studio

A web-based Personal Color Analysis application built for live studio booth consultations and self-discovery. LUMÉA analyzes facial skin, hair, and contrast values in real time using the perceptual **CIELAB (`L*a*b*`)** color space to classify users into 12 seasonal color palettes and generate shareable Digital Color Passports.

**Live Demo:** [adistyasavira.github.io/lumea](https://adistyasavira.github.io/lumea/)

---

## Key Features

* **Ring-Light Calibrated CIELAB Engine:** Converts sRGB camera and photo samples into CIE XYZ and `L*a*b*` color coordinates, applying multi-zone sampling (left cheek, right cheek, forehead, and hair/brow) with trimmed mean filtering to reduce specular glare and lighting bias.
* **12-Season Color Classification:** Evaluates undertone warmth, value lightness, and facial contrast to match users across 12 sub-seasons grouped under **Spring**, **Summer**, **Autumn**, and **Winter**.
* **Digital Color Passport & Stateless QR Sharing:** Renders a downloadable `1080×1920` PNG color passport (`html2canvas`) and embeds result parameters directly into URL hash queries (`qrcode.js`), allowing guests to scan and open their passport on mobile devices without backend routing or 404 errors on static hosting.
* **Interactive 12-Season Palette & Journal:** Explore curated seasonal swatches, styling recommendations, and editorial articles on color theory and beauty.
* **Multi-Device Booth Mode & Live Recap:** PIN-protected operator mode synced via **Supabase Realtime** so multiple booth laptops can log sessions, track seasonal distributions, and monitor daily revenue simultaneously—complete with `localStorage` offline fallback and CSV export.
* **Serverless Consultation Booking:** Connects the booking form directly to email notifications using Web3Forms.

---

## Tech Stack

* **Frontend:** HTML5, Modular CSS3 (Design Tokens), Vanilla JavaScript (ES6+ Modules)
* **Image & Color Processing:** HTML5 Canvas API, Custom CIELAB Color Space & Delta-E Engine
* **Libraries (CDN):** `html2canvas`, `qrcodejs`, `@supabase/supabase-js`
* **Backend Services & Hosting:** Supabase (PostgreSQL + Realtime + RLS), Web3Forms, GitHub Pages

---

## Project Structure

```text
lumea/
├── index.html                  # Main SPA entry point & hash router
├── css/                        # Modular stylesheets & design tokens
│   ├── tokens.css
│   ├── layout.css
│   ├── components.css
│   ├── home.css
│   ├── palettes.css
│   ├── consultation.css
│   ├── passport.css
│   ├── journal.css
│   └── recap.css
├── js/
│   ├── main.js                 # Application bootstrap & navigation
│   ├── config/                 # Calibration constants & service keys
│   ├── color/                  # sRGB → XYZ → CIELAB conversion math
│   ├── analysis/               # Multi-zone sampling & season classifier
│   ├── capture/                # Live webcam guide overlay & photo input
│   ├── passport/               # Stateless URL encoder, QR & PNG generator
│   ├── recap/                  # Supabase sync, offline fallback & CSV export
│   ├── admin/                  # PIN-protected Booth Mode controller
│   ├── booking/                # Form validation & Web3Forms transport
│   ├── data/                   # 12-season palettes & editorial journal data
│   └── ui/                     # Reusable UI renderers
├── supabase/
│   └── schema.sql              # Database table, RLS policies & Realtime setup
└── tests/                      # Unit tests for color engine, passport links & recap