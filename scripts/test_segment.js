const sharp = require('sharp');
const fs = require('fs');

async function testSegmentation() {
  const meta = await sharp('public/karthik.jpg').metadata();
  const w = 480;
  const h = Math.round((meta.height / meta.width) * w);
  
  const { data, info } = await sharp('public/karthik.jpg')
    .resize(w, h)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('Resized to:', info.width, info.height);

  // Background map: true if background wall
  const isBg = new Uint8Array(w * h);

  // 1. Identify wall by color:
  // Wall is low-saturation high-brightness beige/gray:
  // r ~ 140-230, g ~ 130-225, b ~ 125-220, saturation < 0.14
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b);

      // In the upper portion (y < h * 0.65), wall is bright and very neutral
      if (y < h * 0.72) {
        if (lum > 115 && sat < 0.16) {
          isBg[y * w + x] = 1;
        }
      }
    }
  }

  // Flood fill from corners (0,0) and (w-1, 0) to ensure we only classify connected wall
  const visited = new Uint8Array(w * h);
  const queue = [[0, 0], [w - 1, 0], [0, 50], [w - 1, 50]];
  for (const [qx, qy] of queue) visited[qy * w + qx] = 1;

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h * 0.8) {
        const nidx = ny * w + nx;
        if (!visited[nidx]) {
          visited[nidx] = 1;
          const pidx = nidx * info.channels;
          const r = data[pidx];
          const g = data[pidx + 1];
          const b = data[pidx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Wall condition
          if (lum > 105 && sat < 0.18) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  console.log('Flood-filled wall pixels:', queue.length);

  // Now create clean cutout buffer
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pidx = idx * info.channels;
      const oidx = idx * 4;

      if (visited[idx]) {
        // Wall -> pure transparent black
        out[oidx] = 0;
        out[oidx + 1] = 0;
        out[oidx + 2] = 0;
        out[oidx + 3] = 0;
      } else {
        // Karthik!
        out[oidx] = data[pidx];
        out[oidx + 1] = data[pidx + 1];
        out[oidx + 2] = data[pidx + 2];
        out[oidx + 3] = 255;
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile('public/karthik-cutout.png');

  console.log('Saved segmented portrait to public/karthik-cutout.png');
}

testSegmentation().catch(console.error);
