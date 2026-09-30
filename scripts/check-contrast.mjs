/**
 * Contrast gate for the design tokens.
 *
 * WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text (>=24px, or >=18.66px
 * bold) and for non-text UI that identifies a component or state (1.4.11).
 *
 * Tokens are authored in OKLCH, so they are converted here rather than read
 * back from a browser, which keeps the check deterministic and dependency-free.
 *
 *   node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'src', 'index.css'), 'utf8');

/** Extracts `--name: oklch(...)` from the first matching block. */
function tokensFrom(selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Could not find ${selector} in src/index.css`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const block = css.slice(open + 1, close);

  const tokens = {};
  for (const match of block.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)) {
    const parts = match[2].trim().split(/[\s/]+/);
    const [l, c, h] = parts;
    const alpha = parts.length > 3 ? Number(parts[3]) : 1;
    tokens[match[1]] = { l: Number(l), c: Number(c), h: Number(h), alpha };
  }
  return tokens;
}

/** OKLCH -> linear sRGB, per the CSS Color 4 conversion. */
function toLinearSrgb({ l: L, c: C, h: H }) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const lp = L + 0.3963377774 * a + 0.2158037573 * b;
  const mp = L - 0.1055613458 * a - 0.0638541728 * b;
  const sp = L - 0.0894841775 * a - 1.291485548 * b;

  const l = lp ** 3;
  const m = mp ** 3;
  const s = sp ** 3;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function luminance(token) {
  const [r, g, b] = toLinearSrgb(token);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function toHex(token) {
  const linear = toLinearSrgb(token);
  const encode = (value) => {
    const c = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${linear.map(encode).join('')}`;
}

const BODY = 4.5;
const LARGE = 3;

/** [foreground, background, threshold, label] */
const PAIRS = [
  // Body text on the two real surfaces
  ['fg', 'surface', BODY, 'body text on panel'],
  ['fg', 'bg', BODY, 'body text on page'],
  ['fg-strong', 'surface', BODY, 'headings and figures on panel'],
  ['fg-strong', 'bg', BODY, 'headings on page'],
  ['muted', 'surface', BODY, 'descriptions and labels'],
  ['muted', 'bg', BODY, 'descriptions on page'],
  ['subtle', 'surface', BODY, 'captions and metric labels'],
  ['subtle', 'bg', BODY, 'captions on page'],
  ['subtle', 'surface-2', BODY, 'captions on recessed surface'],

  // Semantic text
  ['success', 'surface', BODY, 'positive delta text'],
  ['danger', 'surface', BODY, 'negative delta text'],
  ['accent-fg', 'surface', BODY, 'provisional text on panel'],
  ['accent-fg', 'accent-soft', BODY, 'what-if banner text'],
  ['warning', 'surface', BODY, 'warning text'],
  ['brand', 'surface', BODY, 'brand text on panel'],

  // Filled and tinted pills (11px, so body threshold)
  ['brand-fg', 'brand', BODY, 'primary button label'],
  ['success', 'success-soft', BODY, 'positive pill'],
  ['danger', 'danger-soft', BODY, 'negative pill'],
  ['accent-fg', 'accent-soft', BODY, 'provisional pill'],

  // Non-text: component boundaries and focus (1.4.11 / 2.4.13)
  ['ring', 'surface', LARGE, 'focus ring on panel'],
  ['ring', 'bg', LARGE, 'focus ring on page'],
  ['border-strong', 'surface', LARGE, 'input boundary on panel'],
  ['border-strong', 'bg', LARGE, 'input boundary on page'],
];

const themes = [
  ['light', tokensFrom(':root {')],
  ['dark', tokensFrom('.dark {')],
];

let failures = 0;

for (const [theme, tokens] of themes) {
  console.log(`\n${theme.toUpperCase()}`);
  console.log('-'.repeat(74));
  for (const [fgName, bgName, threshold, label] of PAIRS) {
    const fg = tokens[fgName];
    const bg = tokens[bgName];
    if (!fg || !bg) {
      console.log(`  ??  ${label} (missing token: ${fgName} or ${bgName})`);
      continue;
    }
    const ratio = contrast(fg, bg);
    const ok = ratio >= threshold;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'ok ' : 'FAIL'} ${ratio.toFixed(2).padStart(5)}:1 (needs ${threshold}) ${label.padEnd(34)} ${toHex(fg)} on ${toHex(bg)}`,
    );
  }
}

console.log(
  failures === 0
    ? `\nAll ${PAIRS.length * themes.length} contrast pairs pass WCAG 2.2 AA.\n`
    : `\n${failures} contrast pair(s) below the WCAG 2.2 AA threshold.\n`,
);

process.exit(failures === 0 ? 0 : 1);
