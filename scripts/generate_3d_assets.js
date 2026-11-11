const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate3DAssets() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('Loading karthik.jpg...');
  const { data, info } = await sharp('public/karthik.jpg')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  // 1. Precise segmentation from borders
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

  // Connected person mask from face center
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

  // Alpha erosion by 2px to completely strip any yellow/orange fringe
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

  // Soft feathering (8px gaussian-like blur)
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

  // Output dimensions: 800 x 1000 (standard 4:5 aspect ratio)
  const targetW = 800;
  const targetH = 1000;
  const scale = 1.30;
  const targetHeadCenter = targetW * 0.50;
  const targetHeadTopY = 95; // clean headroom at top

  const colorBuffer = Buffer.alloc(targetW * targetH * 4);
  const depthBuffer = Buffer.alloc(targetW * targetH * 4); // grayscale depth

  // Facial feature centers in target coordinates for depth reconstruction
  // Head center is at tx = 400.
  // In target coordinates:
  // Top of hair ~ 95
  // Forehead ~ 220
  // Eyes/Nose bridge ~ 275
  // Nose tip ~ 320 (x ~ 400)
  // Mouth/mustache ~ 380
  // Chin ~ 435
  // Neck ~ 500
  // Shoulders ~ 620-800
  const noseX = 400;
  const noseY = 320;
  const faceRadiusX = 145;
  const faceRadiusY = 175;

  for (let ty = 0; ty < targetH; ty++) {
    const srcY = 33 + (ty - targetHeadTopY) / scale;

    // Smooth gradient dissolution below collar/chest (starts at ty = 580, completely gone by 880)
    const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (ty - 560) / 280), 1.4)));

    for (let tx = 0; tx < targetW; tx++) {
      const srcX = 415 + (tx - targetHeadCenter) / scale;
      const outIdx = (ty * targetW + tx) * 4;

      if (srcX < 0 || srcX >= w - 1 || srcY < 0 || srcY >= h - 1 || bottomFade <= 0.005) {
        colorBuffer.fill(0, outIdx, outIdx + 4);
        depthBuffer.fill(0, outIdx, outIdx + 4);
        continue;
      }

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

      const finalAlpha = interpA * bottomFade;
      if (finalAlpha <= 0.015) {
        colorBuffer.fill(0, outIdx, outIdx + 4);
        depthBuffer.fill(0, outIdx, outIdx + 4);
        continue;
      }

      const r = (data[idx00 * ch] * (1 - fx) + data[idx10 * ch] * fx) * (1 - fy) + (data[idx01 * ch] * (1 - fx) + data[idx11 * ch] * fx) * fy;
      const g = (data[idx00 * ch + 1] * (1 - fx) + data[idx10 * ch + 1] * fx) * (1 - fy) + (data[idx01 * ch + 1] * (1 - fx) + data[idx11 * ch + 1] * fx) * fy;
      const b = (data[idx00 * ch + 2] * (1 - fx) + data[idx10 * ch + 2] * fx) * (1 - fy) + (data[idx01 * ch + 2] * (1 - fx) + data[idx11 * ch + 2] * fx) * fy;

      const rawLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Color de-contamination: remove any warm fringe at the edge
      // Color grading: near monochrome, slightly cool silver-platinum (#030303 background harmony)
      let radiantLum;
      if (rawLum < 0.14) {
        radiantLum = Math.pow(rawLum / 0.14, 1.25) * 0.14; // deep velvety black
      } else if (rawLum < 0.50) {
        const t = (rawLum - 0.14) / 0.36;
        radiantLum = 0.14 + Math.pow(t, 0.82) * 0.56;
      } else {
        const t = (rawLum - 0.50) / 0.50;
        radiantLum = 0.70 + Math.pow(t, 0.88) * 0.28;
      }

      // Slightly cool editorial grading (tint: subtle cool slate-silver)
      let outR = Math.round(radiantLum * 236);
      let outG = Math.round(radiantLum * 240);
      let outB = Math.round(radiantLum * 245);

      // Subtle edge rim light along the silhouette
      const isEdge = finalAlpha > 0.15 && finalAlpha < 0.85;
      if (isEdge) {
        const rimStrength = (1.0 - Math.abs(finalAlpha - 0.5) * 2.0) * 25;
        outR = Math.min(255, outR + rimStrength * 0.8);
        outG = Math.min(255, outG + rimStrength * 0.95);
        outB = Math.min(255, outB + rimStrength * 1.1);
      }

      colorBuffer[outIdx] = outR;
      colorBuffer[outIdx + 1] = outG;
      colorBuffer[outIdx + 2] = outB;
      colorBuffer[outIdx + 3] = Math.round(finalAlpha * 255);

      // 2. High-Fidelity 3D Depth Map Reconstruction
      // Depth calculation: white (255) = near, black (0) = far.
      // - Nose tip (tx=400, ty=320) is closest (depth ~ 250).
      // - Face elliptical dome: distance from nose / face center gives dome falloff.
      const dxFace = (tx - noseX) / faceRadiusX;
      const dyFace = (ty - noseY) / faceRadiusY;
      const distFaceSq = dxFace * dxFace + dyFace * dyFace;

      let depthVal = 0;
      if (ty < 480) {
        // Head & face region: anatomical 3D ellipsoid with nose ridge
        const dome = Math.max(0, 1.0 - Math.sqrt(distFaceSq));
        // Nose prominence:
        const dNose = Math.sqrt(Math.pow((tx - noseX) / 38, 2) + Math.pow((ty - noseY) / 48, 2));
        const noseBump = Math.max(0, 1.0 - dNose) * 45;
        // Forehead / brow prominence:
        const dBrow = Math.sqrt(Math.pow((tx - noseX) / 90, 2) + Math.pow((ty - 265) / 35, 2));
        const browBump = Math.max(0, 1.0 - dBrow) * 25;
        // Chin prominence:
        const dChin = Math.sqrt(Math.pow((tx - noseX) / 50, 2) + Math.pow((ty - 435) / 35, 2));
        const chinBump = Math.max(0, 1.0 - dChin) * 20;

        depthVal = 80 + dome * 115 + noseBump + browBump + chinBump;
      } else {
        // Neck and chest region: curves backward and down
        const neckDistX = Math.abs(tx - noseX) / 120;
        const neckDome = Math.max(0, 1.0 - neckDistX * 0.7);
        const yDrop = (ty - 480) / 400; // further down = further back
        depthVal = Math.max(25, (95 + neckDome * 40) * (1.0 - yDrop * 0.55));
      }

      // Modulate depth slightly with facial luminance for sub-tile micro-relief (eyeballs recessed, cheeks forward)
      depthVal = Math.max(20, Math.min(255, depthVal + (radiantLum - 0.5) * 22));

      // Mask depth with portrait alpha so background is pure zero
      const maskedDepth = Math.round(depthVal * finalAlpha);

      depthBuffer[outIdx] = maskedDepth;
      depthBuffer[outIdx + 1] = maskedDepth;
      depthBuffer[outIdx + 2] = maskedDepth;
      depthBuffer[outIdx + 3] = Math.round(finalAlpha * 255);
    }
  }

  // Save /public/images/karthik.png
  await sharp(colorBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(path.join(imagesDir, 'karthik.png'));

  // Save /public/images/karthik-depth.png
  await sharp(depthBuffer, { raw: { width: targetW, height: targetH, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(path.join(imagesDir, 'karthik-depth.png'));

  console.log('Successfully generated public/images/karthik.png and public/images/karthik-depth.png!');
}

generate3DAssets().catch(console.error);

