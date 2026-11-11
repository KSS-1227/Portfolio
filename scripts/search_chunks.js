async function searchChunks() {
  const scripts = [
    '/_next/static/immutable/chunks/20es43nb27oti.js',
    '/_next/static/immutable/chunks/3ipau_8jb32ys.js',
    '/_next/static/immutable/chunks/33swp7ki-9dys.js',
    '/_next/static/immutable/chunks/turbopack-3gax_balckqko.js',
    '/_next/static/immutable/chunks/2u-bf1fxugud7.js',
    '/_next/static/immutable/chunks/1rh742y4nq95m.js',
    '/_next/static/immutable/chunks/2corl6wyj4669.js',
    '/_next/static/immutable/chunks/2jbhjwz7i8scy.js',
    '/_next/static/immutable/chunks/2mvbj9r52ibp-.js',
    '/_next/static/immutable/chunks/379-61xj1idep.js',
    '/_next/static/immutable/chunks/0c0hxoamwjsbw.js',
    '/_next/static/immutable/chunks/17tuxysuvqwd2.js'
  ];

  for (const s of scripts) {
    const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app' + s);
    const text = await res.text();
    if (text.includes('sarthak-signal') || text.includes('scene-backdrop') || text.includes('webgl') || text.includes('particle')) {
      console.log('Match in:', s);
      if (text.includes('webgl') || text.includes('canvas') || text.includes('scatter')) {
        console.log('Canvas/webgl keywords in:', s);
        // find a few snippets
        const m = text.match(/(webgl|getContext|fragmentShader|vertexShader|particle|scatter|scene-backdrop)[^;]{0,100}/gi);
        if (m) console.log('Matches:', m.slice(0, 10));
      }
    }
  }
}
searchChunks();
