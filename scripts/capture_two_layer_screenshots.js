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

  // Give Three.js and shaders time to initialize
  await new Promise((r) => setTimeout(r, 2200));

  // 1. p = 0, no hover: face smooth, zero visible grid lines, full head in frame
  console.log('1. Capturing p = 0, no hover...');
  await page.mouse.move(30, 30);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '1-p0-smooth-no-grid.png') });

  // 2. p = 0, pointer on the cheek (x=590, y=300): only a small local gap area
  console.log('2. Capturing p = 0, pointer on the cheek...');
  await page.mouse.move(590, 300);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '2-p0-pointer-cheek.png') });

  // Move pointer away
  await page.mouse.move(30, 30);
  await new Promise((r) => setTimeout(r, 400));

  // 3. p = 0.3 (scrollY = 210px)
  console.log('3. Capturing scroll p = 0.3...');
  await page.evaluate(() => window.scrollTo(0, 210));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(artifactDir, '3-scroll-p03.png') });

  // 4. p = 0.6 (scrollY = 420px)
  console.log('4. Capturing scroll p = 0.6...');
  await page.evaluate(() => window.scrollTo(0, 420));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(artifactDir, '4-scroll-p06.png') });

  // 5. 1478px width viewport showing right edge fully intact
  console.log('5. Capturing 1478px wide viewport...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewport({ width: 1478, height: 900, deviceScaleFactor: 1 });
  await page.mouse.move(30, 30);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(artifactDir, '5-width-1478px-right-edge.png') });

  // 6. 375px width mobile viewport showing right edge fully intact
  console.log('6. Capturing 375px mobile viewport...');
  await page.setViewport({ width: 375, height: 740, deviceScaleFactor: 1 });
  await page.mouse.move(10, 10);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(artifactDir, '6-width-375px-mobile.png') });

  // 7. Scroll back to p = 0 in standard viewport (1280x850) and confirm exact match
  console.log('7. Re-forming back to p = 0 in standard 1280 viewport...');
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(30, 30);
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, '7-reformed-p0.png') });

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

capture().catch(console.error);

