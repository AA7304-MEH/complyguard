const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('LIVE_CONSOLE_ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('LIVE_PAGE_ERROR:', error.message);
  });

  await page.goto('https://complyguard-mu.vercel.app/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
