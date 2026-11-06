// Genera los íconos PNG de Jeep Connect sin dependencias externas.
// Uso: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function createCanvas(size) {
  return { size, data: new Float64Array(size * size * 4) };
}

function blend(canvas, x, y, r, g, b, a) {
  if (a <= 0 || x < 0 || y < 0 || x >= canvas.size || y >= canvas.size) return;
  const i = (y * canvas.size + x) * 4;
  const d = canvas.data;
  const alpha = clamp(a);
  const dstA = d[i + 3];
  const outA = alpha + dstA * (1 - alpha);
  if (outA <= 0) return;
  d[i] = (r * alpha + d[i] * dstA * (1 - alpha)) / outA;
  d[i + 1] = (g * alpha + d[i + 1] * dstA * (1 - alpha)) / outA;
  d[i + 2] = (b * alpha + d[i + 2] * dstA * (1 - alpha)) / outA;
  d[i + 3] = outA;
}

function sdfRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

function paintBackground(canvas, { full = false } = {}) {
  const { size } = canvas;
  for (let y = 0; y < size; y += 1) {
    const t = y / size;
    const top = [7, 20, 39];
    const bottom = [3, 8, 15];
    const r = mix(top[0], bottom[0], t);
    const g = mix(top[1], bottom[1], t);
    const b = mix(top[2], bottom[2], t);
    for (let x = 0; x < size; x += 1) {
      const dx = (x - size * 0.5) / size;
      const dy = (y - size * 0.58) / size;
      const glow = Math.max(0, 1 - Math.hypot(dx, dy) / 0.58) ** 2;
      blend(canvas, x, y, r + glow * 22, g + glow * 54, b + glow * 96, full ? 1 : 0.98);
    }
  }
}

function paintGrille(canvas, { cx, cy, barWidth, barHeight, gap, radius, glow = true, alpha = 1 }) {
  const count = 7;
  const total = count * barWidth + (count - 1) * gap;
  const start = cx - total / 2;
  if (glow) {
    const radiusGlow = total * 0.62;
    for (let y = Math.floor(cy - radiusGlow); y <= cy + radiusGlow; y += 1) {
      for (let x = Math.floor(cx - radiusGlow); x <= cx + radiusGlow; x += 1) {
        const distance = Math.hypot(x - cx, y - cy) / radiusGlow;
        if (distance < 1) {
          const a = (1 - distance) ** 2 * 0.26 * alpha;
          blend(canvas, x, y, 70, 150, 255, a);
        }
      }
    }
  }
  for (let index = 0; index < count; index += 1) {
    const barCenter = start + index * (barWidth + gap) + barWidth / 2;
    const halfW = barWidth / 2;
    const halfH = barHeight / 2;
    const minX = Math.floor(barCenter - halfW - 2);
    const maxX = Math.ceil(barCenter + halfW + 2);
    const minY = Math.floor(cy - halfH - 2);
    const maxY = Math.ceil(cy + halfH + 2);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const distance = sdfRoundRect(x + 0.5, y + 0.5, barCenter, cy, halfW, halfH, radius);
        const coverage = 1 - smooth(-0.8, 0.8, distance);
        if (coverage <= 0) continue;
        const t = clamp((y - (cy - halfH)) / barHeight);
        const r = mix(248, 188, t);
        const g = mix(251, 208, t);
        const b = mix(255, 228, t);
        blend(canvas, x, y, r, g, b, coverage * alpha);
      }
    }
  }
  // Acento verde natural del Jeep Liberty.
  const accentY = cy + barHeight / 2 + Math.max(18, barHeight * 0.11);
  const accentH = Math.max(6, barHeight * 0.035);
  const accentHalfW = total * 0.34;
  for (let y = Math.floor(accentY - accentH); y <= accentY + accentH; y += 1) {
    for (let x = Math.floor(cx - accentHalfW); x <= cx + accentHalfW; x += 1) {
      const distance = sdfRoundRect(x, y, cx, accentY, accentHalfW, accentH / 2, accentH / 2);
      const coverage = 1 - smooth(-0.8, 0.8, distance);
      if (coverage > 0) blend(canvas, x, y, 74, 222, 128, coverage * alpha);
    }
  }
}

function paintRing(canvas, { cx, cy, radius, width, alpha }) {
  for (let y = Math.floor(cy - radius - width); y <= cy + radius + width; y += 1) {
    for (let x = Math.floor(cx - radius - width); x <= cx + radius + width; x += 1) {
      const distance = Math.abs(Math.hypot(x - cx, y - cy) - radius) - width / 2;
      const coverage = 1 - smooth(-1, 1, distance);
      if (coverage > 0) blend(canvas, x, y, 72, 156, 255, coverage * alpha);
    }
  }
}

function downsample(canvas, targetSize) {
  const factor = canvas.size / targetSize;
  const out = Buffer.alloc(targetSize * targetSize * 4);
  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const i = ((y * factor + sy) * canvas.size + (x * factor + sx)) * 4;
          const alpha = canvas.data[i + 3];
          r += canvas.data[i] * alpha;
          g += canvas.data[i + 1] * alpha;
          b += canvas.data[i + 2] * alpha;
          a += alpha;
          count += 1;
        }
      }
      const o = (y * targetSize + x) * 4;
      if (a > 0) {
        out[o] = Math.round(clamp(r / a, 0, 255));
        out[o + 1] = Math.round(clamp(g / a, 0, 255));
        out[o + 2] = Math.round(clamp(b / a, 0, 255));
      }
      out[o + 3] = Math.round(clamp(a / count, 0, 1) * 255);
    }
  }
  return out;
}

function save(name, canvas, size) {
  const path = resolve(root, 'assets', name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(size, size, downsample(canvas, size)));
  console.log('✓', name);
}

// Ícono principal (1024) -----------------------------------------------------
{
  const canvas = createCanvas(1024);
  paintBackground(canvas);
  // Marco de cristal
  for (let y = 0; y < 1024; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const d = sdfRoundRect(x, y, 512, 512, 438, 438, 210);
      const edge = Math.abs(d) - 2.5;
      const coverage = 1 - smooth(-1.5, 1.5, edge);
      if (coverage > 0 && d < 0) blend(canvas, x, y, 90, 170, 255, coverage * 0.055);
      if (d > 0 && d < 6) blend(canvas, x, y, 90, 170, 255, (1 - d / 6) * 0.22);
    }
  }
  paintRing(canvas, { cx: 512, cy: 500, radius: 366, width: 2, alpha: 0.16 });
  paintGrille(canvas, { cx: 512, cy: 500, barWidth: 44, barHeight: 300, gap: 24, radius: 15 });
  save('icon.png', canvas, 1024);
  save('favicon.png', canvas, 64);
}

// Splash (512, fondo transparente) ------------------------------------------
{
  const canvas = createCanvas(1024);
  paintGrille(canvas, { cx: 512, cy: 512, barWidth: 40, barHeight: 268, gap: 22, radius: 13 });
  save('splash-icon.png', canvas, 512);
}

// Android adaptive: fondo, frente y monocromo --------------------------------
{
  const background = createCanvas(1024);
  paintBackground(background, { full: true });
  save('android-icon-background.png', background, 1024);

  const foreground = createCanvas(1024);
  paintGrille(foreground, { cx: 512, cy: 512, barWidth: 38, barHeight: 250, gap: 21, radius: 12 });
  save('android-icon-foreground.png', foreground, 1024);

  const monochrome = createCanvas(1024);
  paintGrille(monochrome, {
    cx: 512,
    cy: 512,
    barWidth: 38,
    barHeight: 250,
    gap: 21,
    radius: 12,
    glow: false,
    alpha: 1,
  });
  // El monocromo usa barras blancas puras.
  for (let i = 0; i < monochrome.data.length; i += 4) {
    if (monochrome.data[i + 3] > 0) {
      monochrome.data[i] = 255;
      monochrome.data[i + 1] = 255;
      monochrome.data[i + 2] = 255;
    }
  }
  save('android-icon-monochrome.png', monochrome, 1024);
}
