const fs = require('fs');
const particles = JSON.parse(fs.readFileSync('public/particles.json', 'utf8'));

// 10 floats per particle:
// [normX, normY, r, g, b, dirX, dirY, seed, size, alpha]
const f32 = new Float32Array(particles.length * 10);
for (let i = 0; i < particles.length; i++) {
  const p = particles[i];
  const base = i * 10;
  for (let j = 0; j < 10; j++) {
    f32[base + j] = p[j];
  }
}

fs.writeFileSync('public/particles.bin', Buffer.from(f32.buffer));
console.log('Saved public/particles.bin, byte length:', f32.byteLength);
