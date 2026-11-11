const sharp = require('sharp');
async function inspectSarthakImage() {
  const { data, info } = await sharp('public/sarthak-signal.webp').raw().toBuffer({ resolveWithObject: true });
  console.log('info:', info);
  
  // Check top-left corner
  let nonZero = 0;
  for (let i = 0; i < info.width * 50; i++) {
    const idx = i * info.channels;
    if (data[idx] > 5 || data[idx+1] > 5 || data[idx+2] > 5) nonZero++;
  }
  console.log('Non-black pixels in top 50 rows:', nonZero, 'out of', info.width * 50);

  // Check center (face)
  let faceColor = [0, 0, 0];
  let faceSamples = 0;
  const startY = Math.round(info.height * 0.35);
  const startX = Math.round(info.width * 0.45);
  for (let y = startY; y < startY + 20; y++) {
    for (let x = startX; x < startX + 20; x++) {
      const idx = (y * info.width + x) * info.channels;
      faceColor[0] += data[idx];
      faceColor[1] += data[idx+1];
      faceColor[2] += data[idx+2];
      faceSamples++;
    }
  }
  console.log('Face avg RGB:', faceColor.map(c => Math.round(c / faceSamples)));

  // Check right hair edge
  let rightEdgeColor = [0, 0, 0];
  let rightSamples = 0;
  const edgeY = Math.round(info.height * 0.28);
  const edgeX = Math.round(info.width * 0.58);
  for (let y = edgeY; y < edgeY + 20; y++) {
    for (let x = edgeX; x < edgeX + 20; x++) {
      const idx = (y * info.width + x) * info.channels;
      rightEdgeColor[0] += data[idx];
      rightEdgeColor[1] += data[idx+1];
      rightEdgeColor[2] += data[idx+2];
      rightSamples++;
    }
  }
  console.log('Right edge avg RGB:', rightEdgeColor.map(c => Math.round(c / rightSamples)));
}
inspectSarthakImage();
