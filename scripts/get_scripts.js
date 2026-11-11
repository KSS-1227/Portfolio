async function getScripts() {
  const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
  const html = await res.text();
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  console.log('Scripts:', scripts);
}
getScripts();
