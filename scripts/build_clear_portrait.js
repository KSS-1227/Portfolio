const sharp = require('sharp');
const fs = require('fs');

async function buildClearPortrait() {
  const meta = await sharp('public/karthik.jpg').metadata();
  const w = 600;
  const h = Math.round((meta.height / meta.width) * w); // ~798
  
  const { data, info } = await sharp('public/karthik.jpg')
    .resize(w, h)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('Image dimensions:', w, h);

  // 1. Precise Wall Detection & Segmentation
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed corners and top border
  for (let x = 0; x < w; x += 2) {
    queue.push([x, 0]);
    visited[x] = 1;
  }
  for (let y = 0; y < h * 0.6; y += 4) {
    queue.push([0, y]);
    queue.push([w - 1, y]);
    visited[y * w] = 1;
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h * 0.78) {
        const nidx = ny * w + nx;
        if (!visited[nidx]) {
          const pidx = nidx * info.channels;
          const r = data[pidx];
          const g = data[pidx + 1];
          const b = data[pidx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Wall in karthik.jpg is neutral high-lum background:
          // Low saturation (< 0.17) and lum > 105
          if (lum > 105 && sat < 0.18) {
            visited[nidx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  console.log('Wall flood-fill complete. Pixels classified as wall:', queue.length);

  // Approximate center of Karthik's face
  const faceCenterX = w * 0.50;
  const faceCenterY = h * 0.33;

  const svgCircles = [];
  const particles = [];
  const step = 3; // Fine stipple grid

  for (let y = 10; y < h - 10; y += step) {
    const xOffset = ((y / step) % 2) * (step * 0.5);
    
    for (let x = 10; x < w - 10; x += step) {
      const px = Math.round(x + xOffset);
      if (px >= w) continue;

      const idx = y * w + px;

      // SKIP the background wall!
      if (visited[idx]) continue;

      const pidx = idx * info.channels;
      const r = data[pidx];
      const g = data[pidx + 1];
      const b = data[pidx + 2];

      const rawLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Bottom dissolution: shirt smoothly fades to black past chest
      const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (y - h * 0.52) / (h * 0.40)), 1.5)));
      if (bottomFade <= 0.01) continue;

      // Check if this pixel is on the outer right boundary of Karthik (for amber rim lighting)
      // Look 12px to the right: if visited[y * w + (px + 12)] is wall, then px is near the right edge!
      let isRightEdge = false;
      let edgeDist = 999;
      if (px > faceCenterX) {
        for (let d = 2; d <= 24; d += 2) {
          if (px + d >= w || visited[y * w + (px + d)]) {
            isRightEdge = true;
            edgeDist = d;
            break;
          }
        }
      }

      // Stretch skin contrast so face is bright, detailed, and crystal clear!
      // In the raw photo, skin is ~0.25 to 0.45 lum.
      // We normalize:
      let normalizedLum;
      if (y < h * 0.55) {
        // Face region: stretch 0.10..0.45 into 0.25..0.95
        normalizedLum = Math.max(0.12, Math.min(1.0, (rawLum - 0.08) * 2.3));
      } else {
        // Shirt region: preserve pattern
        normalizedLum = Math.max(0.10, Math.min(0.9, rawLum * 1.3));
      }

      normalizedLum *= bottomFade;
      if (normalizedLum < 0.08) continue;

      // Particle size based on normalized brightness
      const radius = Math.max(0.7, Math.min(2.3, 0.5 + normalizedLum * 1.8));

      // Color computation:
      let col;
      let rimGlow = 0;

      // True rim light: only within 18px of the right silhouette edge!
      if (isRightEdge && edgeDist <= 18 && y < h * 0.65) {
        rimGlow = Math.max(0, (18 - edgeDist) / 18);
        const t = Math.pow(rimGlow, 1.2);
        const red = Math.round(225 + t * 30);
        const green = Math.round(210 - t * 75);
        const blue = Math.round(195 - t * 145);
        const alpha = Math.min(1, (0.55 + normalizedLum * 0.45)).toFixed(2);
        col = `rgba(${red},${green},${blue},${alpha})`;
      } else {
        // Silky high-contrast monochrome silver-cream stipple
        const val = Math.round(160 + normalizedLum * 95);
        const alpha = Math.min(1, (0.45 + normalizedLum * 0.55)).toFixed(2);
        col = `rgba(${val},${val},${val},${alpha})`;
      }

      svgCircles.push(`<circle cx="${px}" cy="${y}" r="${radius.toFixed(2)}" fill="${col}"/>`);

      // Store particle for the interactive canvas:
      // Normalized coordinates:
      const normX = Number((px / w).toFixed(4));
      const normY = Number((y / h).toFixed(4));

      // Horizontal scatter: Left side scatters far left, Right side scatters far right
      const side = normX < 0.5 ? -1 : 1;
      const distFromCenter = Math.abs(normX - 0.5) * 2;
      const dirX = Number((side * (0.8 + distFromCenter * 1.6 + Math.random() * 0.6)).toFixed(3));
      const dirY = Number(((Math.random() - 0.48) * 0.6).toFixed(3));

      // Scatter travel distance across full screen
      const scatterDist = Math.round(600 + Math.random() * 950);

      particles.push([
        normX,
        normY,
        Number(radius.toFixed(2)),
        Number(normalizedLum.toFixed(2)),
        Number(rimGlow.toFixed(2)),
        Number((0.45 + normalizedLum * 0.55).toFixed(2)),
        dirX,
        dirY,
        scatterDist
      ]);
    }
  }

  // Add subtle ambient dust particles around silhouette
  const dustCount = 800;
  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.75 + Math.random() * 0.35;
    const px = faceCenterX + Math.cos(angle) * (w * 0.36) * rad;
    const py = faceCenterY + Math.sin(angle) * (h * 0.38) * rad;

    if (px < 10 || px > w - 10 || py < 10 || py > h * 0.70) continue;

    const isRight = px > faceCenterX && angle > -Math.PI * 0.25 && angle < Math.PI * 0.35;
    const alpha = (0.12 + Math.random() * 0.25).toFixed(2);
    const r = (0.6 + Math.random() * 0.8).toFixed(2);

    let col = isRight ? `rgba(255,155,55,${alpha})` : `rgba(180,180,185,${alpha})`;
    svgCircles.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${col}"/>`);

    const side = px < faceCenterX ? -1 : 1;
    particles.push([
      Number((px / w).toFixed(4)),
      Number((py / h).toFixed(4)),
      Number(r),
      0.2,
      isRight ? 0.7 : 0,
      Number(alpha),
      Number((side * (1.1 + Math.random() * 1.5)).toFixed(3)),
      Number(((Math.random() - 0.5) * 0.6).toFixed(3)),
      Math.round(750 + Math.random() * 1000)
    ]);
  }

  console.log('Total SVG Circles generated:', svgCircles.length);
  console.log('Total Particles extracted:', particles.length);

  const svgContent = `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#030303"/>
      ${svgCircles.join('\n')}
    </svg>
  `;

  await sharp(Buffer.from(svgContent))
    .webp({ quality: 95 })
    .toFile('public/karthik-signal.webp');

  await sharp(Buffer.from(svgContent))
    .png()
    .toFile('public/karthik-signal.png');

  fs.writeFileSync('public/particles.json', JSON.stringify(particles));
  console.log('Crystal clear portrait & particles saved successfully!');
}

buildClearPortrait().catch(console.error);
