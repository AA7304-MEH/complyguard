const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://complyguard-mu.vercel.app/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'live_screenshot.png' });
  await browser.close();
  console.log('Screenshot saved to live_screenshot.png');
})();
