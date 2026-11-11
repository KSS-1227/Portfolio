async function printParticleCreation2() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/1ekmt9b23jbw-.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('drawImage');
  console.log('Particle creation logic:');
  console.log(text.substring(idx - 100, idx + 1500));
}
printParticleCreation2();
