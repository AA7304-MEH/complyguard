const https = require('https');

const clientId = 'ARp7Y4KJgzLuGxIqW-4QO2tbATQv7i_C6Lsm5yP_zemnIdsMTvpDNGhXjixspuAQZE7fCw3KLhztIzhf';
const url = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;

console.log('Checking PayPal SDK availability for Client ID...');

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  if (res.statusCode === 200) {
    console.log('✅ PayPal SDK is accessible and Client ID is valid.');
  } else {
    console.log('❌ PayPal SDK returned error. Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Error details:', data));
  }
}).on('error', (e) => {
  console.error('Request error:', e.message);
});
