const sharp = require('sharp');
const fs = require('fs');

async function generateStipple() {
  const width = 1000;
  const height = 1250;
  
  // 1. Load and process input photo
  // Karthik's portrait photo
  const inputBuffer = await sharp('public/karthik.jpg')
    .resize(width, height, { fit: 'cover', position: 'top' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = inputBuffer;
  console.log('Image dimensions:', info.width, info.height, 'Channels:', info.channels);

  // Center of head approximately in the resized image
  const cx = width * 0.50;
  const cy = height * 0.40;
  const rx = width * 0.38;
  const ry = height * 0.42;

  let svgCircles = [];
  
  // Grid step size: 4px for dense, high definition stippling
  const step = 4;

  for (let y = 10; y < height - 10; y += step) {
    // Stagger alternate rows for organic triangular packing
    const xOffset = ((y / step) % 2) * (step * 0.5);
    
    for (let x = 10; x < width - 10; x += step) {
      const px = Math.round(x + xOffset);
      if (px >= width) continue;

      const idx = (y * width + px) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Luminance (0 to 1)
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Distance from center
      const dx = (px - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Vertical fade towards bottom (shoulders dissolve into black)
      const bottomFade = Math.max(0, Math.min(1, 1 - (y - height * 0.58) / (height * 0.35)));

      // Outer radial fade
      const radialFade = Math.max(0, Math.min(1, 1 - (dist - 0.75) / 0.45));
      
      const totalFade = bottomFade * radialFade;
      if (totalFade <= 0.02) continue;

      const jitter = ((Math.sin(px * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
      const effectiveLum = lum * totalFade;

      if (effectiveLum < 0.10 && dist < 0.85) {
        if (jitter > 0.88) {
          const col = 'rgba(120,115,110,0.3)';
          svgCircles.push(`<circle cx="${px}" cy="${y}" r="0.8" fill="${col}"/>`);
        }
        continue;
      }

      if (effectiveLum >= 0.10) {
        const radius = Math.max(0.7, Math.min(2.6, 0.6 + effectiveLum * 2.2));

        // Right side (px > cx - 20) gets warm amber rim lighting
        const rightness = Math.max(0, Math.min(1, (px - (cx - width * 0.05)) / (width * 0.35)));
        
        let col;
        if (rightness > 0.3 && effectiveLum > 0.25) {
          const amberT = Math.min(1, (rightness - 0.3) / 0.7);
          const redVal = Math.round(215 + amberT * 40);
          const greenVal = Math.round(205 - amberT * 65);
          const blueVal = Math.round(190 - amberT * 135);
          const alpha = (0.55 + effectiveLum * 0.45).toFixed(2);
          col = `rgba(${redVal},${greenVal},${blueVal},${alpha})`;
        } else {
          const val = Math.round(160 + effectiveLum * 85);
          const alpha = (0.45 + effectiveLum * 0.55).toFixed(2);
          col = `rgba(${val},${Math.round(val * 0.97)},${Math.round(val * 0.92)},${alpha})`;
        }

        svgCircles.push(`<circle cx="${px.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(2)}" fill="${col}"/>`);
      }
    }
  }

  // Ambient outer particle dust field around the silhouette
  const dustCount = 1400;
  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.75 + Math.random() * 0.55;
    const px = cx + Math.cos(angle) * rx * rad;
    const py = cy + Math.sin(angle) * ry * rad;
    
    if (px < 20 || px > width - 20 || py < 20 || py > height - 100) continue;
    if (py > height * 0.85) continue;

    const rightness = Math.max(0, Math.min(1, (px - cx) / (rx * 0.8)));
    const alpha = (0.15 + Math.random() * 0.35).toFixed(2);
    const r = (0.6 + Math.random() * 1.1).toFixed(2);

    let col = rightness > 0.4 ? `rgba(255,155,60,${alpha})` : `rgba(180,175,165,${alpha})`;
    svgCircles.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${col}"/>`);
  }

  console.log('Total stipple points generated:', svgCircles.length);

  const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#030303"/>
      ${svgCircles.join('\n')}
    </svg>
  `;

  await sharp(Buffer.from(svgContent))
    .webp({ quality: 92 })
    .toFile('public/karthik-signal.webp');

  await sharp(Buffer.from(svgContent))
    .png()
    .toFile('public/karthik-signal.png');

  console.log('Successfully generated public/karthik-signal.webp & public/karthik-signal.png!');
}

generateStipple().catch(console.error);
