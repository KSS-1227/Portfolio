async function findSceneBackdropJS() {
  const res = await fetch('https://sarthak-sharma-portfolio-six.vercel.app');
  const html = await res.text();
  const jsMatches = [...html.matchAll(/\/static\/chunks\/[^"]+\.js/g)].map(m => m[0]);
  console.log('Found chunks:', jsMatches.length);
  for (const chunk of jsMatches) {
    const chunkUrl = 'https://sarthak-sharma-portfolio-six.vercel.app/_next' + chunk;
    const chunkRes = await fetch(chunkUrl);
    const chunkText = await chunkRes.text();
    if (chunkText.includes('scene-backdrop') || chunkText.includes('sarthak-signal')) {
      console.log('Match in chunk:', chunk);
      // Find occurrences
      let idx = 0;
      while ((idx = chunkText.indexOf('sarthak-signal', idx)) !== -1) {
        console.log('Snippet:', chunkText.substring(Math.max(0, idx - 150), Math.min(chunkText.length, idx + 250)));
        idx += 14;
      }
    }
  }
}
findSceneBackdropJS();
