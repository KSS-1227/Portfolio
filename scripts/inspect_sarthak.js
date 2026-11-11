async function check() {
  try {
    const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
    const html = await res.text();
    console.log('HTML length:', html.length);
    // Find image or canvas references
    const imgs = html.match(/<img[^>]+>/g) || [];
    console.log('Images found:', imgs.slice(0, 5));
    const canvas = html.match(/<canvas[^>]+>/g) || [];
    console.log('Canvas found:', canvas);
    // Find bundle chunks
    const jsFiles = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
    console.log('JS Chunks:', jsFiles.slice(0, 5));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
check();
