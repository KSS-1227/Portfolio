const sharp = require('sharp');
const fs = require('fs');

async function processWorldClassPortrait() {
  const meta = await sharp('public/karthik.jpg').metadata();
  console.log('Original metadata:', meta.width, meta.height);

  const targetW = 900;
  const targetH = 1125; // 4:5 aspect ratio

  // 1. Resize karthik.jpg
  const { data, info } = await sharp('public/karthik.jpg')
    .resize(targetW, targetH, { fit: 'cover', position: 'top' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  // 2. Identify the background wall with high accuracy
  // In karthik.jpg, the background wall is an off-white plaster wall:
  // It has high brightness (lum > 110) and low color saturation (< 0.20).
  // Hair has lum < 60. Skin has distinct warmth (R > G > B, saturation > 0.20 or lower lum).
  
  // Create mask: 0 = background wall, 1 = Karthik (person)
  const isPerson = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * ch;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;

      // Absolute threshold above hair:
      // Anything above y = 45 in 1125px is guaranteed to be wall!
      if (y < 45) {
        isPerson[y * w + x] = 0;
        continue;
      }

      // Check if it's the wall:
      // Wall has lum > 115 and low saturation (sat < 0.20)
      // Or in the upper half (y < h * 0.45), wall can be lum > 100 with sat < 0.22
      const isWall = (sat < 0.22 && lum > 105) || (y < h * 0.35 && sat < 0.25 && lum > 95);
      
      if (!isWall) {
        isPerson[y * w + x] = 1;
      }
    }
  }

  // Refine mask using flood fill from edges to guarantee only connected background is removed
  const isWallConnected = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let qHead = 0;
  let qTail = 0;

  // Seed top edge and upper side edges
  for (let x = 0; x < w; x++) {
    isWallConnected[x] = 1;
    queue[qTail++] = x;
    queue[qTail++] = 0;
  }
  for (let y = 0; y < h * 0.75; y++) {
    isWallConnected[y * w] = 1;
    queue[qTail++] = 0;
    queue[qTail++] = y;

    isWallConnected[y * w + (w - 1)] = 1;
    queue[qTail++] = w - 1;
    queue[qTail++] = y;
  }

  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < w && ny >= 0 && ny < h * 0.82) {
        const nidx = ny * w + nx;
        if (!isWallConnected[nidx]) {
          const pidx = nidx * ch;
          const r = data[pidx];
          const g = data[pidx + 1];
          const b = data[pidx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;

          // Wall condition
          if (sat < 0.24 && (lum > 100 || (ny < h * 0.35 && lum > 88))) {
            isWallConnected[nidx] = 1;
            queue[qTail++] = nx;
            queue[qTail++] = ny;
          }
        }
      }
    }
  }

  // Smooth the alpha mask
  const alpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      // If connected to wall, alpha = 0. Otherwise alpha = 1.
      alpha[idx] = isWallConnected[idx] ? 0 : 1;
    }
  }

  // 3-pixel box blur for natural feathered edges
  const smoothedAlpha = new Float32Array(w * h);
  const rad = 2;
  for (let y = rad; y < h - rad; y++) {
    for (let x = rad; x < w - rad; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          sum += alpha[(y + dy) * w + (x + dx)];
          count++;
        }
      }
      smoothedAlpha[y * w + x] = sum / count;
    }
  }

  // Build the output buffer
  const outBuffer = Buffer.alloc(w * h * 4);
  const faceCenterX = w * 0.50;

  for (let y = 0; y < h; y++) {
    // Bottom dissolution: shirt smoothly fades to black past chest
    const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (y - h * 0.62) / (h * 0.38)), 1.3)));

    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pidx = idx * ch;
      const outIdx = idx * 4;

      const a = smoothedAlpha[idx] * bottomFade;

      // Pure void for background
      if (a <= 0.015) {
        outBuffer[outIdx] = 0;
        outBuffer[outIdx + 1] = 0;
        outBuffer[outIdx + 2] = 0;
        outBuffer[outIdx + 3] = 0;
        continue;
      }

      const r = data[pidx];
      const g = data[pidx + 1];
      const b = data[pidx + 2];
      const rawLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Find distance to right wall boundary for subtle amber rim-light
      let rightWallDist = 999;
      if (x > faceCenterX && y < h * 0.70) {
        for (let d = 1; d <= 25; d++) {
          if (x + d >= w || isWallConnected[y * w + (x + d)]) {
            rightWallDist = d;
            break;
          }
        }
      }

      // Studio Photographic Relighting:
      // Enhance skin tones so face is clear, luminous, and handsome
      let tonedLum;
      if (y < h * 0.55) {
        // Face region: stretch midtones and highlights
        tonedLum = Math.max(0.04, Math.min(1.0, Math.pow(rawLum * 2.3, 0.86)));
      } else {
        // Shirt & shoulders
        tonedLum = Math.max(0.03, Math.min(0.95, rawLum * 1.4));
      }

      // Luxurious silver-cream tones (matching Sarthak reference)
      let outR = Math.round(tonedLum * 242);
      let outG = Math.round(tonedLum * 238);
      let outB = Math.round(tonedLum * 232);

      // Subtle warm amber studio rim lighting strictly on the outer right silhouette
      if (rightWallDist <= 20) {
        const rimIntensity = Math.pow((20 - rightWallDist) / 20, 1.4);
        outR = Math.min(255, Math.round(outR * (1 - rimIntensity * 0.2) + 250 * rimIntensity));
        outG = Math.min(255, Math.round(outG * (1 - rimIntensity * 0.4) + 145 * rimIntensity));
        outB = Math.max(0, Math.round(outB * (1 - rimIntensity * 0.95) + 15 * rimIntensity));
      }

      outBuffer[outIdx] = Math.round(outR * a);
      outBuffer[outIdx + 1] = Math.round(outG * a);
      outBuffer[outIdx + 2] = Math.round(outB * a);
      outBuffer[outIdx + 3] = Math.round(a * 255);
    }
  }

  // Save the master image as v2 to bypass all browser and Next.js caches!
  await sharp(outBuffer, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 96 })
    .toFile('public/karthik-portrait-v2.webp');

  await sharp(outBuffer, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 96 })
    .toFile('public/karthik-signal.webp');

  console.log('Successfully saved public/karthik-portrait-v2.webp and public/karthik-signal.webp!');

  // Now extract the clean particles from this pristine portrait:
  const sampleW = 280;
  const sampleH = 350;

  const { data: sData, info: sInfo } = await sharp('public/karthik-portrait-v2.webp')
    .resize(sampleW, sampleH, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const particles = [];
  for (let y = 0; y < sInfo.height; y += 2) {
    const xOffset = (y % 4 === 0) ? 0 : 1;
    for (let x = xOffset; x < sInfo.width; x += 2) {
      const idx = (y * sInfo.width + x) * sInfo.channels;
      const alphaVal = sData[idx + 3] / 255;
      if (alphaVal < 0.06) continue; // Skip void background

      const r = sData[idx] / 255;
      const g = sData[idx + 1] / 255;
      const b = sData[idx + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 0.02) continue;

      // Normalized coordinates: [-0.5, 0.5]
      const normX = Number(((x / sInfo.width) - 0.5).toFixed(4));
      const normY = Number(((y / sInfo.height) - 0.5).toFixed(4));

      // Side determination: -1 for left, +1 for right
      const side = normX < 0 ? -1 : 1;
      const distFromCenter = Math.abs(normX) * 2;

      // Full-screen horizontal scatter vectors
      const dirX = Number((side * (1.1 + distFromCenter * 1.6 + Math.random() * 0.7)).toFixed(3));
      const dirY = Number(((Math.random() - 0.48) * 0.8).toFixed(3));
      const seed = Number(Math.random().toFixed(4));
      const size = Number((1.2 + lum * 1.5).toFixed(2));

      particles.push([
        normX,
        normY,
        Number(r.toFixed(3)),
        Number(g.toFixed(3)),
        Number(b.toFixed(3)),
        dirX,
        dirY,
        seed,
        size,
        Number(alphaVal.toFixed(2))
      ]);
    }
  }

  console.log('Extracted pristine particles count:', particles.length);

  // Write binary Float32 buffer
  const f32 = new Float32Array(particles.length * 10);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const base = i * 10;
    for (let j = 0; j < 10; j++) {
      f32[base + j] = p[j];
    }
  }
  fs.writeFileSync('public/particles-v2.bin', Buffer.from(f32.buffer));
  fs.writeFileSync('public/particles.bin', Buffer.from(f32.buffer));
  console.log('Successfully saved particles-v2.bin!');
}

processWorldClassPortrait().catch(console.error);
