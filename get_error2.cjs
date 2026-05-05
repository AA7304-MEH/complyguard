const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER_CONSOLE_ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER_PAGE_ERROR:', error.message);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
