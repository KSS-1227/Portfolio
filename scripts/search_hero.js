async function searchAllChunksForHero() {
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
    if (text.includes('artifact-fallback')) {
      console.log('artifact-fallback found in:', s);
      const idx = text.indexOf('artifact-fallback');
      console.log(text.substring(idx - 400, idx + 800));
    }
  }
}
searchAllChunksForHero();
