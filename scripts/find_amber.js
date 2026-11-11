const sharp = require('sharp');
async function findAmber() {
  const { data, info } = await sharp('public/sarthak-signal.webp').raw().toBuffer({ resolveWithObject: true });
  let maxRedRatio = 0;
  let amberPixel = null;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx+1];
      const b = data[idx+2];
      if (r > 60 && r > g * 1.3 && g > b * 1.3) {
        const ratio = r / (b + 1);
        if (ratio > maxRedRatio) {
          maxRedRatio = ratio;
          amberPixel = { x, y, r, g, b, ratio };
        }
      }
    }
  }
  console.log('Strongest amber pixel:', amberPixel);
}
findAmber();
