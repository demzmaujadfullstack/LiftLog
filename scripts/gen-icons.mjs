// Menghasilkan ikon PWA LIFTLOG (PNG) tanpa dependensi eksternal.
// Desain: barbel lime di atas ubin arang gelap. Jalankan: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const ACCENT = [190, 242, 100]; // #bef264
const BG = [10, 10, 11]; // #0a0a0b

function crc32(buf) {
  let c, crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = crc >>> 8 ^ c;
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA 8-bit
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}


function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - hw + r;
  const dy = Math.abs(py - cy) - hh + r;
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ox, oy) - r;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));

// scale=1 icon biasa (sudut membulat), maskable memakai safe zone full-bleed
function makePixel(size, { fullBleed, scale }) {
  const cx = size / 2;
  const cy = size / 2;
  const u = size * scale;
  const barW = u * 0.44;
  const barH = u * 0.085;
  const plateW = u * 0.115;
  const plateH = u * 0.38;
  const outerW = u * 0.09;
  const outerH = u * 0.28;
  const gap = u * 0.022;
  const aa = size / 220; // ketebalan anti-alias mengikuti resolusi

  const LIME_HI = [217, 249, 157]; // #d9f99d
  const LIME_LO = [132, 204, 22]; // #84cc16
  const STEEL_HI = [161, 161, 170];
  const STEEL_LO = [82, 82, 91];

  const plateX = (side, outer) => {
    const w = outer ? outerW : plateW;
    const inner = barW / 2 + gap + (outer ? plateW + gap : 0);
    return cx + (side * (inner + w / 2));
  };

  return (x, y) => {
    // latar: gradien vertikal sangat halus
    const bgT = clamp01(y / size);
    let col = mix([16, 16, 19], BG, bgT);

    if (!fullBleed) {
      const dTile = sdRoundRect(x, y, cx, cy, size / 2, size / 2, size * 0.185);
      const alpha = clamp01(0.5 - dTile / aa);
      if (alpha <= 0) return [0, 0, 0, 0];
      // masih perlu menggambar objek dengan alpha tile — lanjut, clip di akhir
      const c = drawObjects(x, y, col);
      return [c[0], c[1], c[2], Math.round(alpha * c[3])];
    }
    return drawObjects(x, y, col);
  };

  function drawObjects(x, y, base) {
    let col = base;

    // glow lembut di belakang barbel
    const gd = Math.hypot(x - cx, (y - cy) * 1.35) / (u * 0.62);
    const glow = clamp01(1 - gd) ** 2 * 0.16;
    col = mix(col, ACCENT, glow);

    // bar (kapself)
    const dBar = sdRoundRect(x, y, cx, cy, barW / 2, barH / 2, barH / 2);
    if (dBar < aa) {
      const t = clamp01(0.5 - dBar / aa);
      const grad = mix(STEEL_HI, STEEL_LO, clamp01((y - (cy - barH / 2)) / barH));
      col = mix(col, grad, t);
    }

    // empat pelat
    for (const [side, outer] of [[-1, false], [1, false], [-1, true], [1, true]]) {
      const w = outer ? outerW : plateW;
      const h = outer ? outerH : plateH;
      const px = plateX(side, outer);
      const d = sdRoundRect(x, y, px, cy, w / 2, h / 2, w * 0.32);
      if (d < aa) {
        const t = clamp01(0.5 - d / aa);
        // gradien diagonal + highlight tepi dalam
        const gt = clamp01((x - (px - w / 2)) / w) * 0.5 + clamp01((y - (cy - h / 2)) / h) * 0.5;
        let c = mix(LIME_HI, LIME_LO, gt);
        // kilau vertikal tipis di tengah pelat
        c = mix(c, [236, 252, 203], clamp01(1 - Math.abs(x - px) / (w * 0.18)) * 0.28);
        col = mix(col, c, t);
      }
    }

    return [...col, 255];
  }
}

mkdirSync(OUT, { recursive: true });
const jobs = [
  ["icon-192.png", 192, { fullBleed: false, scale: 0.68 }],
  ["icon-512.png", 512, { fullBleed: false, scale: 0.68 }],
  ["icon-512-maskable.png", 512, { fullBleed: true, scale: 0.5 }],
  ["apple-touch-icon.png", 180, { fullBleed: true, scale: 0.62 }],
];
for (const [name, size, opts] of jobs) {
  writeFileSync(join(OUT, name), encodePng(size, makePixel(size, opts)));
  console.log(`${name} (${size}x${size})`);
}
