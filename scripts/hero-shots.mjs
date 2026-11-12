// Saves hero screenshots to disk (no image output). Usage: node scripts/hero-shots.mjs [url]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const url = process.argv[2] || "http://localhost:3000";
const out = "scripts/_shots";
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on("console", (m) => m.type() === "error" && console.log("console.error:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2500));
const vh = 900;
const geom = await page.evaluate(() => {
  const s = document.querySelector("section").getBoundingClientRect();
  return { top: s.top };
});
const ph = Math.min(Math.max(vh * 0.66, 400), 780), pw = ph * (1280 / 1753);
const cheek = { x: 1440 / 2 + (0.367 - 0.5) * pw, y: 112 + 0.43 * ph };
console.log("portrait px", Math.round(pw), "x", Math.round(ph), "cheek", cheek);
const settle = () => new Promise((r) => setTimeout(r, 1500));
const shot = async (name) => { await page.screenshot({ path: `${out}/${name}.png` }); };
// p = 0
await page.mouse.move(5, 5); await page.evaluate(() => window.scrollTo(0, 0)); await settle();
await shot("p0");
// pointer on the cheek
await page.mouse.move(cheek.x - 60, cheek.y - 40); await page.mouse.move(cheek.x, cheek.y, { steps: 8 }); await settle();
await shot("hover");
await page.mouse.move(5, 5); await settle();
for (const p of [0.3, 0.6, 1]) {
  await page.evaluate((y) => window.scrollTo(0, y), p * 0.9 * vh);
  await settle();
  await shot("p" + String(p).replace(".", "_"));
}
const m = await page.evaluate(() => {
  const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.right), Math.round(b.bottom + scrollY)]; };
  return { h1: r("h1"), p: r("section p"), canvas: r("canvas") };
});
console.log(JSON.stringify(m));
await browser.close();
