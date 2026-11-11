async function inspectSceneChunk() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/2jbhjwz7i8scy.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Length:', text.length);
  // Print first 3000 chars of the module definition
  console.log(text.substring(0, 3000));
}
inspectSceneChunk();
