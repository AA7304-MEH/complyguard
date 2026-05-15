const https = require('https');

const clientId = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
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
