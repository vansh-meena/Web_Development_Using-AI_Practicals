// Deterministic SVG generator. Same (prompt, style, seed, aspect) always
// produces the identical SVG. Uses the exact aspect dimensions as viewBox.

import { STYLES, ASPECTS } from './styles.js';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Small seeded PRNG (mulberry32) so each seed yields a reproducible stream.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function labelWords(prompt, max) {
  const words = String(prompt).trim().split(/\s+/).filter(Boolean).slice(0, max);
  return words.join(' ');
}

const PALETTES = {
  neon: ['#ff00e6', '#00fff7', '#7a00ff', '#ff2d55', '#00b3ff'],
  pixel: ['#6abc4a', '#e4d13a', '#c44b3a', '#4a8bd8', '#d87fb0', '#f29a3a'],
  watercolor: ['#f6a6b2', '#a3c4e8', '#c9e4ca', '#f5d98b', '#d8b3e8', '#fbb6a5'],
  anime: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#6a89cc', '#e056fd', '#48dbfb'],
  '3d': ['#f7b267', '#f4845f', '#f25c54', '#7fb7ed', '#a4c2f4', '#e8c07d'],
  photoreal: ['#d9c7b0', '#c2a878', '#e6d7c0', '#b8a07a', '#e0cdb2', '#a8917a'],
};

function shapesForStyle(style, w, h, r) {
  const palette = PALETTES[style] || PALETTES.photoreal;
  let body = '';

  if (style === 'neon') {
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#0b0212"/>`;
    // glowing lines
    const lines = 14;
    for (let i = 0; i < lines; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const x = Math.floor(r() * w);
      const y1 = Math.floor(r() * h);
      const y2 = Math.floor(r() * h);
      const sw = 1 + Math.floor(r() * 3);
      body += `<line x1="${x}" y1="${y1}" x2="${x + Math.floor(r() * 200 - 100)}" y2="${y2}" stroke="${col}" stroke-width="${sw}" opacity="${0.5 + r() * 0.5}"/>`;
    }
    // glowing nodes
    for (let i = 0; i < 8; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const cx = Math.floor(r() * w);
      const cy = Math.floor(r() * h);
      const rad = 3 + Math.floor(r() * 6);
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}" opacity="0.9"/>`;
      body += `<circle cx="${cx}" cy="${cy}" r="${rad * 3}" fill="${col}" opacity="0.18"/>`;
    }
  } else if (style === 'pixel') {
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#243b1b"/>`;
    const cols = 16;
    const rows = Math.round(cols * h / w);
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (r() < 0.55) {
          const col = palette[Math.floor(r() * palette.length)];
          body += `<rect x="${Math.floor(x * cw)}" y="${Math.floor(y * ch)}" width="${Math.ceil(cw)}" height="${Math.ceil(ch)}" fill="${col}" opacity="${0.6 + r() * 0.4}"/>`;
        }
      }
    }
  } else if (style === 'watercolor') {
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#fbf6f0"/>`;
    for (let i = 0; i < 14; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const cx = Math.floor(r() * w);
      const cy = Math.floor(r() * h);
      const rx = 60 + Math.floor(r() * 160);
      const ry = 50 + Math.floor(r() * 140);
      body += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" opacity="${0.18 + r() * 0.22}"/>`;
    }
  } else if (style === 'anime') {
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff4e6"/>`;
    for (let i = 0; i < 10; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const cx = Math.floor(r() * w);
      const cy = Math.floor(r() * h);
      const rad = 40 + Math.floor(r() * 140);
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}" opacity="${0.55 + r() * 0.35}"/>`;
    }
  } else if (style === '3d') {
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#e9eef5"/>`;
    for (let i = 0; i < 6; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const cx = Math.floor(r() * (w - 200)) + 100;
      const cy = Math.floor(r() * (h - 200)) + 100;
      const rad = 50 + Math.floor(r() * 90);
      // shaded sphere: base + highlight
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}"/>`;
      body += `<ellipse cx="${cx - rad * 0.3}" cy="${cy - rad * 0.35}" rx="${rad * 0.3}" ry="${rad * 0.22}" fill="#ffffff" opacity="0.55"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const x = Math.floor(r() * (w - 160));
      const y = Math.floor(r() * (h - 160));
      const s = 70 + Math.floor(r() * 80);
      body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${col}" opacity="0.8"/>`;
      body += `<rect x="${x}" y="${y}" width="${s}" height="${s * 0.18}" fill="#000000" opacity="0.12"/>`;
    }
  } else {
    // photoreal -> soft bokeh circles
    body += `<rect x="0" y="0" width="${w}" height="${h}" fill="#1c1a18"/>`;
    for (let i = 0; i < 22; i++) {
      const col = palette[Math.floor(r() * palette.length)];
      const cx = Math.floor(r() * w);
      const cy = Math.floor(r() * h);
      const rad = 20 + Math.floor(r() * 120);
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}" opacity="${0.10 + r() * 0.20}"/>`;
      body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${col}" stroke-width="1.5" opacity="${0.25 + r() * 0.3}"/>`;
    }
  }

  return body;
}

export function demoSvg(prompt, styleId, seed, aspectId) {
  const style = STYLES[styleId] || STYLES.photoreal;
  const aspect = ASPECTS[aspectId] || ASPECTS.square;
  const w = aspect.width;
  const h = aspect.height;

  const seedNum = Number(seed) || 0;
  const seedStr = `${prompt}|${styleId}|${seedNum}|${aspectId}`;
  const r = rng(hash(seedStr));

  const bg = shapesForStyle(style.id, w, h, r);

  const label = escapeXml(labelWords(prompt, 5));
  const styleLabel = escapeXml(style.label);
  const seedLabel = escapeXml(String(seedNum));

  // Dark translucent strip for readable label.
  const stripH = 64;
  const stripY = h - stripH;
  const labelSvg = `
<rect x="0" y="${stripY}" width="${w}" height="${stripH}" fill="#000000" opacity="0.55"/>
<text x="20" y="${stripY + 26}" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">${label}</text>
<text x="20" y="${stripY + 48}" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#d8d8d8">${styleLabel} &#183; seed ${seedLabel} &#183; Demo image</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg}${labelSvg}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
