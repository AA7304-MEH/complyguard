const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  await page.goto('https://complyguard-mu.vercel.app/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
