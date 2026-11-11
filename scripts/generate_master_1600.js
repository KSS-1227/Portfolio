const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateMaster1600() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

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
  const isWall = new Uint8Array(w * h);
  const queue = new Int32Array(w * h * 2);
  let qHead = 0;
  let qTail = 0;

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
    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];

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

          let isBg = false;
          if (ny <= 34) {
            isBg = true;
          } else if (sat < 0.22 && lum > 82) {
            isBg = true;
          } else if (sat < 0.28 && lum > 105) {
            isBg = true;
          } else if (lum > 142) {
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

  // Connected person mask from face center (x=415, y=260)
  const isPerson = new Uint8Array(w * h);
  let pQueue = new Int32Array(w * h * 2);
  let pqHead = 0;
  let pqTail = 0;
  isPerson[260 * w + 415] = 1;
  pQueue[pqTail++] = 415;
  pQueue[pqTail++] = 260;

  while (pqHead < pqTail) {
    const cx = pQueue[pqHead++];
    const cy = pQueue[pqHead++];
    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!isPerson[nidx] && !isWall[nidx]) {
          isPerson[nidx] = 1;
          pQueue[pqTail++] = nx;
          pQueue[pqTail++] = ny;
        }
      }
    }
  }

  // Alpha erosion by 2px to strip any color fringe
  const erodedPerson = new Uint8Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (isPerson[y * w + x]) {
        let keep = 1;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (!isPerson[(y + dy) * w + (x + dx)]) {
              keep = 0;
              break;
            }
          }
          if (!keep) break;
        }
        erodedPerson[y * w + x] = keep;
      }
    }
  }

  // Soft feathering (8px smooth blur)
  const alphaMap = new Float32Array(w * h);
  const blurRad = 4;
  for (let y = blurRad; y < h - blurRad; y++) {
    for (let x = blurRad; x < w - blurRad; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -blurRad; dy <= blurRad; dy++) {
        for (let dx = -blurRad; dx <= blurRad; dx++) {
          sum += erodedPerson[(y + dy) * w + (x + dx)];
          count++;
        }
      }
      alphaMap[y * w + x] = sum / count;
    }
  }

  // Target dimensions: 1280 x 1600
  const targetW = 1280;
  const targetH = 1600;

  const scale = 2.05;
  const targetHeadCenter = targetW * 0.50; // 640
  const targetHeadTopY = 160; // generous headroom at top

  const colorBuffer = Buffer.alloc(targetW * targetH * 4);
  const depthBuffer = Buffer.alloc(targetW * targetH * 4);

  const noseX = 640;
  const noseY = 520;
  const faceRadiusX = 240;
  const faceRadiusY = 290;

  for (let ty = 0; ty < targetH; ty++) {
    const srcY = 33 + (ty - targetHeadTopY) / scale;

    // Smooth gradient dissolution below collar/chest (starts at ty = 920, fully dissolved by 1420)
    const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (ty - 900) / 460), 1.4)));

    for (let tx = 0; tx < targetW; tx++) {
      const srcX = 415 + (tx - targetHeadCenter) / scale;
      const outIdx = (ty * targetW + tx) * 4;

      const distFromMidX = Math.abs(tx - targetHeadCenter);
      const sideFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (distFromMidX - 360) / 220), 1.5)));
      const combinedFade = bottomFade * sideFade;

      if (srcX < 0 || srcX >= w - 1 || srcY < 0 || srcY >= h - 1 || combinedFade <= 0.005) {
        colorBuffer.fill(0, outIdx, outIdx + 4);
        depthBuffer.fill(0, outIdx, outIdx + 4);
        continue;
      }

      // Bilinear interpolation
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

      const a00 = alphaMap[idx00];
      const a10 = alphaMap[idx10];
      const a01 = alphaMap[idx01];
      const a11 = alphaMap[idx11];
      const interpA = (a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy;

      const finalAlpha = interpA * combinedFade;
      if (finalAlpha <= 0.01) {
        colorBuffer.fill(0, outIdx, outIdx + 4);
        depthBuffer.fill(0, outIdx, outIdx + 4);
        continue;
      }

      // Sample source RGB via bilinear interpolation
      const r = (data[idx00 * ch] * (1 - fx) + data[idx10 * ch] * fx) * (1 - fy) + (data[idx01 * ch] * (1 - fx) + data[idx11 * ch] * fx) * fy;
      const g = (data[idx00 * ch + 1] * (1 - fx) + data[idx10 * ch + 1] * fx) * (1 - fy) + (data[idx01 * ch + 1] * (1 - fx) + data[idx11 * ch + 1] * fx) * fy;
      const b = (data[idx00 * ch + 2] * (1 - fx) + data[idx10 * ch + 2] * fx) * (1 - fy) + (data[idx01 * ch + 2] * (1 - fx) + data[idx11 * ch + 2] * fx) * fy;

      const rawLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // ── BRIGHTER GRADING ──────────────────────────────────────────────────
      // S-curve that lifts the face well above the dark background:
      //   blacks   stay deep (rawLum < 0.08 → near 0)
      //   skin midtones 0.15–0.50 → map to 0.42–0.76 (bright & clear)
      //   highlights → near 1.0 so the face reads against #030303
      let radiantLum;
      if (rawLum < 0.08) {
        // Deep blacks preserved, slightly lifted
        radiantLum = rawLum * 0.6;
      } else if (rawLum < 0.22) {
        const t = (rawLum - 0.08) / 0.14;
        radiantLum = 0.048 + t * 0.22; // 0.048 → 0.268
      } else if (rawLum < 0.55) {
        const t = (rawLum - 0.22) / 0.33;
        // Strong midtone lift — this is where most skin lives
        radiantLum = 0.268 + Math.pow(t, 0.65) * 0.42; // → 0.688
      } else {
        const t = (rawLum - 0.55) / 0.45;
        radiantLum = 0.688 + Math.pow(t, 0.80) * 0.28; // → 0.968
      }

      // Cool slate-silver grading (slightly desaturated, slightly blue-shifted)
      // Preserve a tiny hint of the original skin warmth so it still reads as a face
      const sFactor = 0.18; // desaturation strength (0 = full mono, 1 = no change)
      const monoLum = radiantLum;

      // Keep a small fraction of the original color channel difference
      const origNorm = 255;
      const rOrig = r / origNorm;
      const gOrig = g / origNorm;
      const bOrig = b / origNorm;
      const origLumRaw = 0.299 * rOrig + 0.587 * gOrig + 0.114 * bOrig;

      const rFinal = origLumRaw > 0 ? monoLum + (rOrig - origLumRaw) * sFactor : monoLum;
      const gFinal = origLumRaw > 0 ? monoLum + (gOrig - origLumRaw) * sFactor : monoLum;
      const bFinal = origLumRaw > 0 ? monoLum + (bOrig - origLumRaw) * sFactor + 0.025 : monoLum + 0.025; // slight cool shift

      let outR = Math.round(Math.max(0, Math.min(1, rFinal)) * 255);
      let outG = Math.round(Math.max(0, Math.min(1, gFinal)) * 255);
      let outB = Math.round(Math.max(0, Math.min(1, bFinal)) * 255);

      // Subtle soft rim light along alpha edges
      const isEdge = finalAlpha > 0.15 && finalAlpha < 0.85;
      if (isEdge) {
        const rimStrength = (1.0 - Math.abs(finalAlpha - 0.5) * 2.0) * 18;
        outR = Math.min(255, outR + Math.round(rimStrength * 0.75));
        outG = Math.min(255, outG + Math.round(rimStrength * 0.9));
        outB = Math.min(255, outB + Math.round(rimStrength * 1.1));
      }

      colorBuffer[outIdx] = outR;
      colorBuffer[outIdx + 1] = outG;
      colorBuffer[outIdx + 2] = outB;
      colorBuffer[outIdx + 3] = Math.round(finalAlpha * 255);

      // 2. Anatomical 3D Depth Map
      const dxFace = (tx - noseX) / faceRadiusX;
      const dyFace = (ty - noseY) / faceRadiusY;
      const distFaceSq = dxFace * dxFace + dyFace * dyFace;

      let depthVal = 0;
      if (ty < 780) {
        const dome = Math.max(0, 1.0 - Math.sqrt(distFaceSq));
        const dNose = Math.sqrt(Math.pow((tx - noseX) / 60, 2) + Math.pow((ty - noseY) / 75, 2));
        const noseBump = Math.max(0, 1.0 - dNose) * 42;
        const dBrow = Math.sqrt(Math.pow((tx - noseX) / 140, 2) + Math.pow((ty - 430) / 55, 2));
        const browBump = Math.max(0, 1.0 - dBrow) * 24;
        const dChin = Math.sqrt(Math.pow((tx - noseX) / 80, 2) + Math.pow((ty - 690) / 55, 2));
        const chinBump = Math.max(0, 1.0 - dChin) * 20;

        depthVal = 85 + dome * 110 + noseBump + browBump + chinBump;
      } else {
        const neckDistX = Math.abs(tx - noseX) / 180;
        const neckDome = Math.max(0, 1.0 - neckDistX * 0.7);
        const yDrop = (ty - 780) / 600;
        depthVal = Math.max(25, (95 + neckDome * 35) * (1.0 - yDrop * 0.55));
      }

      depthVal = Math.max(20, Math.min(255, depthVal + (radiantLum - 0.5) * 18));
      const maskedDepth = Math.round(depthVal * finalAlpha);

      depthBuffer[outIdx] = maskedDepth;
      depthBuffer[outIdx + 1] = maskedDepth;
      depthBuffer[outIdx + 2] = maskedDepth;
      depthBuffer[outIdx + 3] = Math.round(finalAlpha * 255);
    }
  }

  console.log('Writing public/images/karthik.png (1280x1600)...');
  await sharp(colorBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(path.join(imagesDir, 'karthik.png'));

  console.log('Pre-blurring and writing public/images/karthik-depth.png (1280x1600)...');
  await sharp(depthBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .blur(2.5)
    .png({ compressionLevel: 8 })
    .toFile(path.join(imagesDir, 'karthik-depth.png'));

  console.log('1600px master assets generated successfully!');
}

generateMaster1600().catch(console.error);
