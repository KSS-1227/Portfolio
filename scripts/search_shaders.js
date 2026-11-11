async function searchShaders() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/_next/static/immutable/chunks/1ekmt9b23jbw-.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Shader search:');
  const matches = [...text.matchAll(/(vertexShader|fragmentShader|gl_Position)[^;]{0,200}/g)];
  for (const m of matches) {
    console.log(m[0]);
  }
}
searchShaders();
