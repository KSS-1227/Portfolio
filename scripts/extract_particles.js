const sharp = require('sharp');
const fs = require('fs');

async function extractParticles() {
  const width = 480;
  const height = 600;
  
  const inputBuffer = await sharp('public/karthik.jpg')
    .resize(width, height, { fit: 'cover', position: 'top' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = inputBuffer;
  console.log('Sampling image:', info.width, info.height);

  const cx = width * 0.50;
  const cy = height * 0.40;
  const rx = width * 0.38;
  const ry = height * 0.42;

  const particles = [];
  const step = 4; // Dense particle sampling

  for (let y = 10; y < height - 10; y += step) {
    const xOffset = ((y / step) % 2) * (step * 0.5);
    
    for (let x = 10; x < width - 10; x += step) {
      const px = Math.round(x + xOffset);
      if (px >= width) continue;

      const idx = (y * width + px) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      const dx = (px - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const bottomFade = Math.max(0, Math.min(1, 1 - (y - height * 0.58) / (height * 0.35)));
      const radialFade = Math.max(0, Math.min(1, 1 - (dist - 0.75) / 0.45));
      const totalFade = bottomFade * radialFade;

      if (totalFade <= 0.02) continue;

      const jitter = ((Math.sin(px * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
      const effectiveLum = lum * totalFade;

      if (effectiveLum >= 0.10) {
        // Normalize coordinates to 0..1 range with 4 decimal places
        const normX = Number((px / width).toFixed(4));
        const normY = Number((y / height).toFixed(4));
        const normR = Number((Math.max(0.7, Math.min(2.5, 0.6 + effectiveLum * 2.0))).toFixed(2));
        
        // Right side gets warm amber rim lighting
        const rightness = Number(Math.max(0, Math.min(1, (px - (cx - width * 0.05)) / (width * 0.35))).toFixed(2));
        const opacity = Number((0.45 + effectiveLum * 0.55).toFixed(2));

        // Scatter direction: normalized vector with left/right bias
        // Left side (< 0.5) scatters negative X, Right side (>= 0.5) scatters positive X
        const dirX = px < cx ? -(0.6 + Math.random() * 0.8) : +(0.6 + Math.random() * 0.8);
        const dirY = (Math.random() - 0.45) * 0.8;
        const scatterDist = Math.round(80 + Math.random() * 260);

        particles.push([
          normX,
          normY,
          normR,
          effectiveLum,
          rightness,
          opacity,
          Number(dirX.toFixed(3)),
          Number(dirY.toFixed(3)),
          scatterDist
        ]);
      }
    }
  }

  // Add ambient dust particles around silhouette
  const dustCount = 800;
  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.75 + Math.random() * 0.5;
    const px = cx + Math.cos(angle) * rx * rad;
    const py = cy + Math.sin(angle) * ry * rad;
    
    if (px < 10 || px > width - 10 || py < 10 || py > height - 60) continue;
    if (py > height * 0.82) continue;

    const normX = Number((px / width).toFixed(4));
    const normY = Number((y => (py / height).toFixed(4))());
    const rightness = Number(Math.max(0, Math.min(1, (px - cx) / (rx * 0.8))).toFixed(2));
    const dirX = px < cx ? -(0.8 + Math.random() * 1.0) : +(0.8 + Math.random() * 1.0);
    const dirY = (Math.random() - 0.5) * 0.9;
    const scatterDist = Math.round(120 + Math.random() * 300);

    particles.push([
      normX,
      normY,
      0.9,
      0.2,
      rightness,
      0.35,
      Number(dirX.toFixed(3)),
      Number(dirY.toFixed(3)),
      scatterDist
    ]);
  }

  console.log('Total particles sampled:', particles.length);
  fs.writeFileSync('public/particles.json', JSON.stringify(particles));
  console.log('Saved to public/particles.json');
}

extractParticles().catch(console.error);
