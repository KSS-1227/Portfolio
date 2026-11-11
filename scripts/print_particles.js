async function printParticleCreation() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/1ekmt9b23jbw-.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('let r=new Image;return r.onload');
  console.log('Particle creation logic:');
  console.log(text.substring(idx, idx + 2000));
}
printParticleCreation();
