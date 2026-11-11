async function downloadSarthakImage() {
  const url = 'https://sarthak-sharma-portfolio-six.vercel.app/images/sarthak-signal.webp';
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const fs = require('fs');
  fs.writeFileSync('public/sarthak-signal.webp', Buffer.from(buf));
  console.log('Saved public/sarthak-signal.webp, size:', buf.byteLength);
  const sharp = require('sharp');
  const meta = await sharp('public/sarthak-signal.webp').metadata();
  console.log('Sarthak image metadata:', meta);
}
downloadSarthakImage();
