async function findSceneBackdropFull() {
  const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
  const html = await res.text();
  const idx = html.indexOf('scene-backdrop');
  if (idx !== -1) {
    console.log(html.substring(idx + 1500, idx + 2500));
  }
}
findSceneBackdropFull();
