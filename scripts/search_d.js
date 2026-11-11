async function searchD() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('artifact-fallback');
  console.log(text.substring(idx - 2500, idx));
}
searchD();
