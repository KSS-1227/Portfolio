const sharp = require('sharp');
const fs = require('fs');

async function extractMasterParticles() {
  // Sample at high resolution for maximum clarity (320 x 400 grid)
  const sampleW = 300;
  const sampleH = 375;

  const { data, info } = await sharp('public/karthik-signal.webp')
    .resize(sampleW, sampleH, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const particles = [];
  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  for (let y = 0; y < h; y += 2) { // 2px step gives ~28,000 fine stipple points
    const xOffset = (y % 4 === 0) ? 0 : 1;
    for (let x = xOffset; x < w; x += 2) {
      const idx = (y * w + x) * ch;
      const a = data[idx + 3] / 255;
      if (a < 0.05) continue; // black background

      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 0.03) continue;

      // Normalized coordinates: x in [-0.5, 0.5], y in [-0.5, 0.5]
      const normX = Number(((x / w) - 0.5).toFixed(4));
      const normY = Number(((y / h) - 0.5).toFixed(4));

      // Side determination: -1 for left, +1 for right
      const side = normX < 0 ? -1 : 1;
      const distFromCenter = Math.abs(normX) * 2; // 0 at center, 1 at edge

      // Scatter vector: flies to the furthest left/right edges of screen
      // Wide horizontal flight with natural organic vertical dispersion
      const dirX = Number((side * (1.2 + distFromCenter * 1.8 + Math.random() * 0.8)).toFixed(3));
      const dirY = Number(((Math.random() - 0.48) * 0.9).toFixed(3));
      const seed = Number(Math.random().toFixed(4));

      // Point size based on brightness
      const size = Number((1.2 + lum * 1.6).toFixed(2));

      // Packed particle: [normX, normY, r, g, b, dirX, dirY, seed, size, a]
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
        Number(a.toFixed(2))
      ]);
    }
  }

  console.log('Generated master particles count:', particles.length);
  fs.writeFileSync('public/particles.json', JSON.stringify(particles));
  console.log('Successfully saved public/particles.json');
}

extractMasterParticles().catch(console.error);
