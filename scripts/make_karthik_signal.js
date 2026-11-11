const sharp = require('sharp');
const fs = require('fs');

async function createKarthikSignal() {
  const meta = await sharp('public/karthik.jpg').metadata();
  const targetW = 1000;
  const targetH = 1250;

  // Karthik's original is 770 x 1024.
  // Resize to fit nicely into 1000 x 1250
  const resized = await sharp('public/karthik.jpg')
    .resize(targetW, targetH, { fit: 'cover', position: 'top' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  console.log('Resized image:', w, h);

  // Accurate wall segmentation using multi-seed flood fill from perimeter
  const isWall = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let qHead = 0;
  let qTail = 0;

  // Add top edge and upper side edges as wall seeds
  for (let x = 0; x < w; x++) {
    isWall[x] = 1;
    queue[qTail++] = x;
    queue[qTail++] = 0;
  }
  for (let y = 0; y < h * 0.7; y++) {
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

      // Wall exists mostly above chest level
      if (nx >= 0 && nx < w && ny >= 0 && ny < h * 0.82) {
        const nidx = ny * w + nx;
        if (!isWall[nidx]) {
          const pidx = nidx * ch;
          const r = data[pidx];
          const g = data[pidx + 1];
          const b = data[pidx + 2];

          // Compute color properties
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Wall in karthik.jpg is neutral, low-sat, bright off-white wall:
          // Hair is dark (lum < 50), skin has warmth/sat or darker lum
          // Wall has sat < 0.20 and lum > 115 (or near top > 90)
          const isNeutralWall = sat < 0.22 && (lum > 110 || (ny < h * 0.35 && lum > 95));
          if (isNeutralWall) {
            isWall[nidx] = 1;
            queue[qTail++] = nx;
            queue[qTail++] = ny;
          }
        }
      }
    }
  }

  console.log('Wall flood-fill count:', qTail / 2);

  // Create clean alpha mask with edge feathering (3px blur)
  const alpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      alpha[idx] = isWall[idx] ? 0 : 1;
    }
  }

  // Smooth the alpha boundaries
  const smoothedAlpha = new Float32Array(w * h);
  const radius = 2;
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          sum += alpha[(y + dy) * w + (x + dx)];
          count++;
        }
      }
      smoothedAlpha[y * w + x] = sum / count;
    }
  }

  // Build the master RGBA buffer
  const outBuffer = Buffer.alloc(w * h * 4);
  const faceCenterX = w * 0.50;

  for (let y = 0; y < h; y++) {
    // Dissolve bottom of shirt smoothly to pure black
    const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (y - h * 0.65) / (h * 0.35)), 1.4)));

    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pidx = idx * ch;
      const outIdx = idx * 4;

      const a = smoothedAlpha[idx] * bottomFade;
      if (a <= 0.01) {
        // Pure black background
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

      // Check distance to right wall (for studio amber rim-light on right hair/shoulder)
      let rightWallDist = 999;
      if (x > faceCenterX && y < h * 0.75) {
        for (let d = 1; d <= 30; d++) {
          if (x + d >= w || isWall[y * w + (x + d)]) {
            rightWallDist = d;
            break;
          }
        }
      }

      // Studio Photographic Toning:
      // Enhance skin contrast so face is bright, detailed, and crystal clear (silver-cream studio look)
      let tonedLum;
      if (y < h * 0.55) {
        // Face region: stretch midtones and highlights so skin is bright and luminous
        tonedLum = Math.max(0.04, Math.min(1.0, Math.pow(rawLum * 2.2, 0.88)));
      } else {
        // Shirt & shoulders
        tonedLum = Math.max(0.03, Math.min(0.95, rawLum * 1.45));
      }

      // Base monochrome silver tone (matching Sarthak's [194, 189, 186])
      let outR = Math.round(tonedLum * 240);
      let outG = Math.round(tonedLum * 235);
      let outB = Math.round(tonedLum * 230);

      // Apply subtle amber rim lighting along the right edge
      if (rightWallDist <= 24) {
        const rimIntensity = Math.pow((24 - rightWallDist) / 24, 1.3);
        outR = Math.min(255, Math.round(outR * (1 - rimIntensity * 0.25) + 250 * rimIntensity));
        outG = Math.min(255, Math.round(outG * (1 - rimIntensity * 0.45) + 140 * rimIntensity));
        outB = Math.max(0, Math.round(outB * (1 - rimIntensity * 0.95) + 15 * rimIntensity));
      }

      // Apply soft alpha feathering at boundary
      outBuffer[outIdx] = Math.round(outR * a);
      outBuffer[outIdx + 1] = Math.round(outG * a);
      outBuffer[outIdx + 2] = Math.round(outB * a);
      outBuffer[outIdx + 3] = Math.round(a * 255);
    }
  }

  // Save the master webp
  await sharp(outBuffer, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 95, lossless: false })
    .toFile('public/karthik-signal.webp');

  await sharp(outBuffer, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile('public/karthik-signal.png');

  console.log('Successfully generated public/karthik-signal.webp and public/karthik-signal.png!');
}

createKarthikSignal().catch(console.error);
