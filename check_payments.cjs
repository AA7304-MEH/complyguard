const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('https://complyguard-mu.vercel.app/', { waitUntil: 'networkidle2' });
  
  // The payment configuration is logged in paymentService.ts
  // CONSOLE: Payment Configuration: [object Object]
  // CONSOLE: ? Razorpay Key ID loaded: ...
  // CONSOLE: ? PayPal Client ID loaded: ...
  
  await new Promise(r => setTimeout(r, 5000));
  
  const paymentStatus = await page.evaluate(() => {
    return {
      razorpayInjected: typeof window.Razorpay !== 'undefined',
      paypalInjected: typeof window.paypal !== 'undefined'
    };
  });
  
  console.log('PAYMENT_STATUS:', JSON.stringify(paymentStatus));
  
  await browser.close();
})();
