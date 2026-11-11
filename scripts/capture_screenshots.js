const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const artifactDir = 'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\3238c92b-ed7f-46c3-aed6-ab58e755214d';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log('Launching Chrome from:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,850',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Give Three.js time to compile shaders and render first frame
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Center of face (x=640, y=285)
  console.log('1. Pointer at center of face (x=640, y=285)...');
  await page.mouse.move(640, 285);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '1-pointer-face-center.png') });

  // 2. Left cheek (x=595, y=295)
  console.log('2. Pointer at left cheek (x=595, y=295)...');
  await page.mouse.move(595, 295);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '2-pointer-left-cheek.png') });

  // 3. Right shoulder (x=715, y=415)
  console.log('3. Pointer at right shoulder (x=715, y=415)...');
  await page.mouse.move(715, 415);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '3-pointer-right-shoulder.png') });

  // Move pointer away for pure scroll disassembly captures
  await page.mouse.move(20, 20);
  await new Promise((r) => setTimeout(r, 400));

  // 4. Scroll progress p = 0.3 (scrollY = 210px)
  console.log('4. Scroll p = 0.3 (scrollY = 210)...');
  await page.evaluate(() => window.scrollTo(0, 210));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(artifactDir, '4-scroll-p03.png') });

  // 5. Scroll progress p = 0.6 (scrollY = 420px)
  console.log('5. Scroll p = 0.6 (scrollY = 420)...');
  await page.evaluate(() => window.scrollTo(0, 420));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(artifactDir, '5-scroll-p06.png') });

  // 6. Scroll progress p = 1.0 (scrollY = 700px)
  console.log('6. Scroll p = 1.0 (scrollY = 700)...');
  await page.evaluate(() => window.scrollTo(0, 700));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(artifactDir, '6-scroll-p10.png') });

  // 7. Scroll back to p = 0 (scrollY = 0) to confirm exact re-formation
  console.log('7. Scrolling back to p = 0 (scrollY = 0)...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, '7-reformed-p0.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(console.error);
