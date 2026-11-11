async function findImageTag() {
  const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
  const html = await res.text();
  const idx = html.indexOf('<img alt="" fetchPriority="high"');
  if (idx !== -1) {
    console.log(html.substring(idx - 200, idx + 600));
  }
}
findImageTag();
