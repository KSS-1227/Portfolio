async function inspectHero() {
  const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
  const html = await res.text();
  // Find the hero section code or inline scripts
  const heroIndex = html.indexOf('sarthak-signal.webp');
  console.log('Snippet around sarthak-signal.webp:');
  console.log(html.substring(heroIndex - 300, heroIndex + 400));
}
inspectHero();
