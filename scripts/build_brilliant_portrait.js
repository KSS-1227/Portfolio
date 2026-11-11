const sharp = require('sharp');
const fs = require('fs');

async function buildBrilliantPortrait() {
  console.log('Loading raw portrait: public/karthik.jpg...');
  const { data, info } = await sharp('public/karthik.jpg')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  console.log('Original dimensions:', w, h);

  // 1. Precise Background Wall Flood-Fill Segmentation
  // In karthik.jpg:
  // - Background wall is high luminance (lum > 90) and low saturation (sat < 0.22)
  // - Hair is very dark (lum < 50)
  // - Skin has distinct warm chrominance (r > g + 10, sat > 0.20)
  // - Hair starts at y ~ 35. Above y = 30 is 100% background wall.
  const isWall = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let qHead = 0;
  let qTail = 0;

  // Seed outer borders as wall
  for (let x = 0; x < w; x++) {
    isWall[x] = 1;
    queue[qTail++] = x;
    queue[qTail++] = 0;

    isWall[(h - 1) * w + x] = 1;
    queue[qTail++] = x;
    queue[qTail++] = h - 1;
  }
  for (let y = 0; y < h; y++) {
    isWall[y * w] = 1;
    queue[qTail++] = 0;
    queue[qTail++] = y;

    isWall[y * w + (w - 1)] = 1;
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

      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!isWall[nidx]) {
          const pidx = nidx * ch;
          const r = data[pidx];
          const g = data[pidx + 1];
          const b = data[pidx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Background wall condition:
          // Anything above y = 32 is guaranteed background
          let isBg = false;
          if (ny <= 32) {
            isBg = true;
          } else if (sat < 0.22 && lum > 82) {
            isBg = true;
          } else if (sat < 0.28 && lum > 105) {
            isBg = true;
          } else if (lum > 145) {
            isBg = true;
          }

          if (isBg) {
            isWall[nidx] = 1;
            queue[qTail++] = nx;
            queue[qTail++] = ny;
          }
        }
      }
    }
  }

  console.log('Wall segmentation complete. Wall pixels:', qTail / 2);

  // 2. Isolate Karthik's Connected Person Mask
  // Karthik's face center is around x = 415, y = 260.
  // We do connected component from face center to ensure NO disconnected wall shadows (like x=97, y=400) survive!
  const isPerson = new Uint8Array(w * h);
  let pQueue = new Int32Array(w * h * 2);
  let pqHead = 0;
  let pqTail = 0;

  // Seed face center
  const seedX = 415;
  const seedY = 260;
  isPerson[seedY * w + seedX] = 1;
  pQueue[pqTail++] = seedX;
  pQueue[pqTail++] = seedY;

  while (pqHead < pqTail) {
    const cx = pQueue[pqHead++];
    const cy = pQueue[pqHead++];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        // If not visited, and NOT wall
        if (!isPerson[nidx] && !isWall[nidx]) {
          isPerson[nidx] = 1;
          pQueue[pqTail++] = nx;
          pQueue[pqTail++] = ny;
        }
      }
    }
  }

  console.log('Connected person pixels:', pqTail / 2);

  // 3. Smooth Mask with 2px Box Blur for Natural Sub-Pixel Feathering
  const rawAlpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    rawAlpha[i] = isPerson[i] ? 1.0 : 0.0;
  }

  const smoothedAlpha = new Float32Array(w * h);
  const rad = 2;
  for (let y = rad; y < h - rad; y++) {
    for (let x = rad; x < w - rad; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          sum += rawAlpha[(y + dy) * w + (x + dx)];
          count++;
        }
      }
      smoothedAlpha[y * w + x] = sum / count;
    }
  }

  // 4. Determine Exact Bounding Box of Karthik's Face & Head
  let minPersonX = w, maxPersonX = 0, minPersonY = h, maxPersonY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isPerson[y * w + x]) {
        if (x < minPersonX) minPersonX = x;
        if (x > maxPersonX) maxPersonX = x;
        if (y < minPersonY) minPersonY = y;
        if (y > maxPersonY) maxPersonY = y;
      }
    }
  }
  console.log('Person bounding box:', { minPersonX, maxPersonX, minPersonY, maxPersonY });

  // 5. Professional Portrait Grading & Brilliant Relighting
  // Target master dimensions: 900 x 1125 (4:5 golden portrait ratio)
  // We want Karthik's head centered with ~10% headroom at the top,
  // and smooth dissolution below chest.
  const targetW = 900;
  const targetH = 1125;

  // Let's compute crop and scale from karthik.jpg to 900x1125:
  // Head width in karthik.jpg is maxPersonX - minPersonX = ~330px (from x ~ 240 to 570)
  // In 900x1125, we want portrait head width ~ 460px (approx 51% of targetW)
  // Scale factor: 460 / 330 = ~1.39
  // Head top minPersonY is ~35.
  // With 10% headroom in targetH (1125), head top should be at y ~ 110px.
  // Center of head in karthik.jpg: x = 415.
  // In target, center of head should be targetW * 0.50 = 450.
  const scale = 1.35;
  const targetHeadCenter = targetW * 0.50; // 450
  const targetHeadTopY = 110; // 110px headroom at top!

  const outBuffer = Buffer.alloc(targetW * targetH * 4);

  for (let ty = 0; ty < targetH; ty++) {
    // In karthik.jpg coords:
    const srcY = minPersonY + (ty - targetHeadTopY) / scale;

    // Dissolve smoothly at the bottom (below collar/chest)
    // In target coordinates, face ends around ty = 540, neck ends around ty = 660.
    // Feathered fade out from ty = 640 to ty = 920.
    const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (ty - 620) / 280), 1.4)));

    for (let tx = 0; tx < targetW; tx++) {
      const srcX = 415 + (tx - targetHeadCenter) / scale;
      const outIdx = (ty * targetW + tx) * 4;

      if (srcX < 0 || srcX >= w - 1 || srcY < 0 || srcY >= h - 1 || bottomFade <= 0.005) {
        outBuffer[outIdx] = 0;
        outBuffer[outIdx + 1] = 0;
        outBuffer[outIdx + 2] = 0;
        outBuffer[outIdx + 3] = 0;
        continue;
      }

      // Bilinear interpolation in source image
      const x0 = Math.floor(srcX);
      const x1 = x0 + 1;
      const y0 = Math.floor(srcY);
      const y1 = y0 + 1;
      const fx = srcX - x0;
      const fy = srcY - y0;

      const idx00 = y0 * w + x0;
      const idx10 = y0 * w + x1;
      const idx01 = y1 * w + x0;
      const idx11 = y1 * w + x1;

      // Sample smoothed alpha
      const a00 = smoothedAlpha[idx00];
      const a10 = smoothedAlpha[idx10];
      const a01 = smoothedAlpha[idx01];
      const a11 = smoothedAlpha[idx11];
      const interpA = (a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy;

      const finalAlpha = interpA * bottomFade;
      if (finalAlpha <= 0.01) {
        outBuffer[outIdx] = 0;
        outBuffer[outIdx + 1] = 0;
        outBuffer[outIdx + 2] = 0;
        outBuffer[outIdx + 3] = 0;
        continue;
      }

      // Sample colors
      const r00 = data[idx00 * ch], g00 = data[idx00 * ch + 1], b00 = data[idx00 * ch + 2];
      const r10 = data[idx10 * ch], g10 = data[idx10 * ch + 1], b10 = data[idx10 * ch + 2];
      const r01 = data[idx01 * ch], g01 = data[idx01 * ch + 1], b01 = data[idx01 * ch + 2];
      const r11 = data[idx11 * ch], g11 = data[idx11 * ch + 1], b11 = data[idx11 * ch + 2];

      const r = (r00 * (1 - fx) + r10 * fx) * (1 - fy) + (r01 * (1 - fx) + r11 * fx) * fy;
      const g = (g00 * (1 - fx) + g10 * fx) * (1 - fy) + (g01 * (1 - fx) + g11 * fx) * fy;
      const b = (b00 * (1 - fx) + b10 * fx) * (1 - fy) + (b01 * (1 - fx) + b11 * fx) * fy;

      const rawLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // "Piece of Brilliant" Studio Dynamic Relighting:
      // - Skin tones (rawLum 0.35..0.55) are lifted to 0.65..0.92 with warm radiant clarity.
      // - Deep hair/eyes (rawLum < 0.18) remain rich, crisp, velvety black.
      // - Natural specular highlights on forehead, nose, cheekbones.
      let radiantLum;
      if (rawLum < 0.12) {
        // Deep obsidian hair & pupils: preserve depth
        radiantLum = Math.pow(rawLum / 0.12, 1.3) * 0.12;
      } else if (rawLum < 0.48) {
        // Facial midtones and skin: expand dynamic range smoothly
        const t = (rawLum - 0.12) / 0.36;
        radiantLum = 0.12 + Math.pow(t, 0.78) * 0.58; // brings 0.35 up to ~0.55, 0.48 up to 0.70
      } else {
        // Luminous highlights: sparkling brilliance
        const t = (rawLum - 0.48) / 0.52;
        radiantLum = 0.70 + Math.pow(t, 0.85) * 0.28; // up to 0.98
      }

      // Check distance to silhouette edge on right side (for subtle champagne rim light)
      let rightEdgeDist = 999;
      if (tx > targetHeadCenter && ty < 680) {
        const checkSrcY = Math.round(srcY);
        const checkSrcX = Math.round(srcX);
        if (checkSrcY >= 0 && checkSrcY < h) {
          for (let d = 1; d <= 22; d++) {
            const sx = checkSrcX + d;
            if (sx >= w || !isPerson[checkSrcY * w + sx]) {
              rightEdgeDist = d;
              break;
            }
          }
        }
      }

      // Luxury platinum-silver studio tone with warm skin essence
      let outR = Math.round(radiantLum * 245);
      let outG = Math.round(radiantLum * 240);
      let outB = Math.round(radiantLum * 235);

      // Subtle warm amber/champagne rim lighting strictly on the outer right silhouette
      if (rightEdgeDist <= 18) {
        const rim = Math.pow((18 - rightEdgeDist) / 18, 1.5);
        outR = Math.min(255, Math.round(outR * (1 - rim * 0.20) + 252 * rim));
        outG = Math.min(255, Math.round(outG * (1 - rim * 0.40) + 160 * rim));
        outB = Math.max(0, Math.round(outB * (1 - rim * 0.92) + 30 * rim));
      }

      outBuffer[outIdx] = Math.round(outR * finalAlpha);
      outBuffer[outIdx + 1] = Math.round(outG * finalAlpha);
      outBuffer[outIdx + 2] = Math.round(outB * finalAlpha);
      outBuffer[outIdx + 3] = Math.round(finalAlpha * 255);
    }
  }

  // Save the master WebP and PNG
  await sharp(outBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .webp({ quality: 96 })
    .toFile('public/karthik-signal.webp');

  await sharp(outBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .webp({ quality: 96 })
    .toFile('public/karthik-portrait-v2.webp');

  console.log('Successfully saved public/karthik-signal.webp and public/karthik-portrait-v2.webp!');

  // 6. Extract Master Particles from this Flawless Portrait
  // Sampling on a high-density 280 x 350 grid
  const sampleW = 280;
  const sampleH = 350;

  const { data: sData, info: sInfo } = await sharp('public/karthik-signal.webp')
    .resize(sampleW, sampleH, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const particles = [];
  for (let y = 0; y < sInfo.height; y += 2) {
    const xOffset = (y % 4 === 0) ? 0 : 1;
    for (let x = xOffset; x < sInfo.width; x += 2) {
      const idx = (y * sInfo.width + x) * sInfo.channels;
      const alphaVal = sData[idx + 3] / 255;
      if (alphaVal < 0.05) continue; // Pure void background: ZERO particles!

      const r = sData[idx] / 255;
      const g = sData[idx + 1] / 255;
      const b = sData[idx + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 0.015) continue;

      // Normalized coordinates: x in [-0.5, 0.5], y in [-0.5, 0.5]
      const normX = Number(((x / sInfo.width) - 0.5).toFixed(4));
      const normY = Number(((y / sInfo.height) - 0.5).toFixed(4));

      // Side determination: -1 for left, +1 for right
      const side = normX < 0 ? -1 : 1;
      const distFromCenter = Math.abs(normX) * 2;

      // Luxurious, graceful horizontal scatter vectors
      const dirX = Number((side * (0.9 + distFromCenter * 1.5 + Math.random() * 0.6)).toFixed(3));
      const dirY = Number(((Math.random() - 0.48) * 0.65).toFixed(3));
      const seed = Number(Math.random().toFixed(4));

      // Brilliant point size: radiant highlights get crisp stipple definition
      const size = Number((1.2 + Math.pow(lum, 0.85) * 1.8).toFixed(2));

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

  console.log('Extracted brilliant particles count:', particles.length);

  // Write binary Float32 buffer
  const f32 = new Float32Array(particles.length * 10);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const base = i * 10;
    for (let j = 0; j < 10; j++) {
      f32[base + j] = p[j];
    }
  }

  fs.writeFileSync('public/particles.json', JSON.stringify(particles));
  fs.writeFileSync('public/particles.bin', Buffer.from(f32.buffer));
  fs.writeFileSync('public/particles-v2.bin', Buffer.from(f32.buffer));
  console.log('Successfully saved public/particles.bin and public/particles-v2.bin!');
}

buildBrilliantPortrait().catch(console.error);

