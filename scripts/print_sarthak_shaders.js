async function printSarthakShaders() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/1ekmt9b23jbw-.js';
  const res = await fetch(url);
  const text = await res.text();
  const idx = text.indexOf('vertexShader:e6');
  console.log('Context around vertexShader:e6:');
  console.log(text.substring(idx - 2500, idx + 400));
}
printSarthakShaders();
