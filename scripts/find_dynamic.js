async function findDynamicImport() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('children:(0,t.jsx)(d,{onFailure:S,onReady:k})');
  console.log(text.substring(idx - 1500, idx));
}
findDynamicImport();
