const sharp = require('sharp');
const fs = require('fs');

async function generateMasterStipple() {
  const width = 1000;
  const height = 1250;
  
  // 1. Load portrait photo
  const inputBuffer = await sharp('public/karthik.jpg')
    .resize(width, height, { fit: 'cover', position: 'top' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = inputBuffer;
  console.log('Image dimensions:', info.width, info.height);

  const cx = width * 0.50;
  const cy = height * 0.40;
  const rx = width * 0.38;
  const ry = height * 0.42;

  let svgCircles = [];
  const particles = [];
  const step = 3; // Ultra-fine 3px density for $10k luxury fidelity

  for (let y = 8; y < height - 8; y += step) {
    const xOffset = ((y / step) % 2) * (step * 0.5);
    
    for (let x = 8; x < width - 8; x += step) {
      const px = Math.round(x + xOffset);
      if (px >= width) continue;

      const idx = (y * width + px) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // High-precision perceptual luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      const dx = (px - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Smooth vertical dissolution towards bottom
      const bottomFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (y - height * 0.55) / (height * 0.40)), 1.4)));
      // Smooth radial falloff around silhouette
      const radialFade = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (dist - 0.72) / 0.36), 1.6)));
      
      const totalFade = bottomFade * radialFade;
      if (totalFade <= 0.015) continue;

      const effectiveLum = lum * totalFade;
      if (effectiveLum < 0.08) continue; // Deep blacks remain pure void

      // Calculate rim light intensity:
      // Smooth gradient: ONLY outer right edge (hair contour & right jawline)
      let rimGlow = 0;
      if (px > cx && dist > 0.55) {
        const rimAngleFactor = Math.max(0, Math.cos(Math.atan2(dy, dx) - 0.2));
        const rimDistFactor = Math.pow(Math.max(0, (dist - 0.55) / 0.40), 1.8);
        rimGlow = Math.min(1, rimAngleFactor * rimDistFactor * 1.6);
      }

      // Point size dynamically scaled with luminance
      const radius = Math.max(0.65, Math.min(2.2, 0.5 + Math.pow(effectiveLum, 0.85) * 1.7));

      // Color computation - smooth cinematic blend:
      let col;
      if (rimGlow > 0.08) {
        // Subtle warm golden/amber rim glow on the outer edge
        const t = Math.min(1, rimGlow * 1.4);
        const red = Math.round(220 + t * 35);
        const green = Math.round(210 - t * 70);
        const blue = Math.round(195 - t * 140);
        const alpha = Math.min(1, (0.45 + effectiveLum * 0.55 + t * 0.2)).toFixed(2);
        col = `rgba(${red},${green},${blue},${alpha})`;
      } else {
        // Pure luxurious silver-white monochrome stipple
        const val = Math.round(155 + effectiveLum * 95);
        const alpha = Math.min(1, (0.40 + effectiveLum * 0.60)).toFixed(2);
        col = `rgba(${val},${val},${val},${alpha})`;
      }

      svgCircles.push(`<circle cx="${px.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(2)}" fill="${col}"/>`);

      // Store particle for live canvas scatter
      // Direction: Left side scatters wide left, Right side scatters wide right
      const normX = Number((px / width).toFixed(4));
      const normY = Number((y / height).toFixed(4));
      
      // Horizontal scatter direction:
      // Particles on the left go far left (-0.8 to -2.2), particles on the right go far right (+0.8 to +2.2)
      const side = normX < 0.5 ? -1 : 1;
      const distanceFromMid = Math.abs(normX - 0.5) * 2; // 0 at center, 1 at edge
      const dirX = Number((side * (0.8 + distanceFromMid * 1.4 + Math.random() * 0.6)).toFixed(3));
      const dirY = Number(((Math.random() - 0.48) * 0.8).toFixed(3));
      
      // Scatter distance: large distance so they reach the very edge of wide monitors
      const scatterDist = Math.round(450 + Math.random() * 850);

      particles.push([
        normX,
        normY,
        Number(radius.toFixed(2)),
        Number(effectiveLum.toFixed(2)),
        Number(rimGlow.toFixed(2)),
        Number((0.4 + effectiveLum * 0.6).toFixed(2)),
        dirX,
        dirY,
        scatterDist
      ]);
    }
  }

  // Add ambient dust particles in an ethereal aura around the head
  const dustCount = 1200;
  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.72 + Math.random() * 0.48;
    const px = cx + Math.cos(angle) * rx * rad;
    const py = cy + Math.sin(angle) * ry * rad;
    
    if (px < 15 || px > width - 15 || py < 15 || py > height - 80) continue;
    if (py > height * 0.80) continue;

    const dx = (px - cx) / rx;
    const dy = (y => (py - cy) / ry)();
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isRight = px > cx && angle > -Math.PI * 0.3 && angle < Math.PI * 0.4;
    const alpha = (0.12 + Math.random() * 0.28).toFixed(2);
    const r = (0.6 + Math.random() * 0.9).toFixed(2);

    let col = isRight ? `rgba(255,160,65,${alpha})` : `rgba(180,180,185,${alpha})`;
    svgCircles.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${col}"/>`);

    const side = px < cx ? -1 : 1;
    particles.push([
      Number((px / width).toFixed(4)),
      Number((py / height).toFixed(4)),
      Number(r),
      0.2,
      isRight ? 0.8 : 0,
      Number(alpha),
      Number((side * (1.0 + Math.random() * 1.5)).toFixed(3)),
      Number(((Math.random() - 0.5) * 0.8).toFixed(3)),
      Math.round(600 + Math.random() * 900)
    ]);
  }

  console.log('Total SVG points:', svgCircles.length);
  console.log('Total JSON particles:', particles.length);

  const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#030303"/>
      ${svgCircles.join('\n')}
    </svg>
  `;

  await sharp(Buffer.from(svgContent))
    .webp({ quality: 94 })
    .toFile('public/karthik-signal.webp');

  await sharp(Buffer.from(svgContent))
    .png()
    .toFile('public/karthik-signal.png');

  fs.writeFileSync('public/particles.json', JSON.stringify(particles));
  console.log('Master stipple & particles successfully generated!');
}

generateMasterStipple().catch(console.error);
