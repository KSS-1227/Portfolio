const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\3238c92b-ed7f-46c3-aed6-ab58e755214d';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--use-angle=swiftshader',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 20000 });

  // Wait for Three.js to initialize
  await new Promise(r => setTimeout(r, 4000));

  const heroPath = path.join(artifactDir, 'verify-hero-fixed.png');
  await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log('Hero screenshot saved:', heroPath);

  // Also mobile view
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  const mobilePath = path.join(artifactDir, 'verify-hero-mobile.png');
  await page.screenshot({ path: mobilePath, clip: { x: 0, y: 0, width: 375, height: 812 } });
  console.log('Mobile screenshot saved:', mobilePath);

  await browser.close();
  console.log('Done.');
}

capture().catch(e => { console.error(e); process.exit(1); });

