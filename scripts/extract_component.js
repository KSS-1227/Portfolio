async function extractComponent() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  const vsIdx = text.indexOf('vertexShader:');
  console.log(text.substring(vsIdx - 2000, vsIdx + 200));
}
extractComponent();
