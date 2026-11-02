import localFont from "next/font/local";

// Self-hosted Inter (v4.001, the exact files next/font/google served), optimized
// with fontTools without changing any glyph the site renders:
//   - wght axis clamped to 400-900: nothing uses weights below 400, and 900 is the
//     font's own master, so in-range weights render byte-for-byte the same
//     (clamping the top end lower re-rounds outlines and shifts pixels)
//   - OpenType features kept: kern, calt, ccmp, mark, mkmk; unused ones (frac, numr, dnom,
//     pnum, Catalan locl, tnum) dropped along with their glyphs
//   - unhinted, same per-subset character coverage and unicode-range as before
// Only the latin face is preloaded; the other subsets load on demand via
// unicode-range, exactly like next/font/google did. All faces share the
// family name "Inter" so tailwind's `font-sans` keeps resolving to them.
// The latin face is declared last so it wins for overlapping code points.

const interCyrillicExt = localFont({
  src: [{ path: "./inter/inter-cyrillic-ext.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const interCyrillic = localFont({
  src: [{ path: "./inter/inter-cyrillic.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const interGreekExt = localFont({
  src: [{ path: "./inter/inter-greek-ext.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+1F??" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const interGreek = localFont({
  src: [{ path: "./inter/inter-greek.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const interVietnamese = localFont({
  src: [{ path: "./inter/inter-vietnamese.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const interLatinExt = localFont({
  src: [{ path: "./inter/inter-latin-ext.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const inter = localFont({
  src: [{ path: "./inter/inter-latin.woff2", weight: "400 900", style: "normal" }],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+00??, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  // Same metric-matched Arial fallback next/font/google generated; see globals.css.
  fallback: ["Inter Fallback"],
});

// Referenced so the on-demand subsets' @font-face rules are never tree-shaken.
export const interSubsets = [
  interCyrillicExt, interCyrillic, interGreekExt, interGreek, interVietnamese, interLatinExt,
];
