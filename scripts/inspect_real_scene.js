async function inspectRealScene() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/1ekmt9b23jbw-.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Length:', text.length);
  // Find shader or particles
  console.log(text.substring(0, 3500));
}
inspectRealScene();
