async function findDynamic() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/379-61xj1idep.js';
  const res = await fetch(url);
  const text = await res.text();
  const matches = [...text.matchAll(/ssr:\s*!1[^}]*}/g)];
  console.log('Matches:', matches.map(m => m[0]));
  // Also search for dynamic(
  const dMatches = [...text.matchAll(/dynamic\([^)]+\)/g)];
  console.log('dMatches:', dMatches.map(m => m[0]));
}
findDynamic();
