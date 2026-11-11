async function extractScene() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  
  // Find vertexShader and fragmentShader
  const vsIdx = text.indexOf('vertexShader:');
  if (vsIdx !== -1) {
    console.log('--- VERTEX SHADER & CONTEXT ---');
    console.log(text.substring(vsIdx - 300, vsIdx + 1200));
  }

  const fsIdx = text.indexOf('fragmentShader:');
  if (fsIdx !== -1) {
    console.log('--- FRAGMENT SHADER & CONTEXT ---');
    console.log(text.substring(fsIdx, fsIdx + 800));
  }
}
extractScene();
