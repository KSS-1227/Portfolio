async function seeDynamic() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('ssr:!1}');
  console.log(text.substring(idx - 200, idx + 100));
}
seeDynamic();
