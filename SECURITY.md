# Security Best Practices for ComplyGuard AI

ComplyGuard AI is built with security as a top priority. Below are the measures taken to ensure the platform is robust and secure for heavy production usage.

## 1. Environment Variable Protection
- **Zero-Secret Client Exposure**: Sensitive API keys (like `GEMINI_API_KEY`) are kept strictly on the server-side (`api/` routes). They are NOT prefixed with `VITE_` to ensure they are never bundled into the frontend JavaScript.
- **Vite Sanitization**: The build process uses a custom `vite.config.ts` transform to ensure only the necessary public keys are available at runtime.

## 2. API Hardening
- **Input Validation**: The `/api/analyze` endpoint enforces a strict 50,000-character limit on document text to prevent payload injection or resource exhaustion.
- **Structured Output**: Using Gemini's `responseMimeType: "application/json"` and `responseSchema` ensures the AI output is always valid JSON, preventing parsing errors and ensuring stable UI rendering.
- **Method Restriction**: All analysis and scanning endpoints strictly enforce `POST` methods to prevent CSRF and unauthorized data access.

## 3. Deployment & Scalability
- **Serverless Architecture**: Built on Vercel's global edge network, the platform automatically scales to handle spikes in traffic without manual server management.
- **Caching**: The `/api/health` endpoint uses `Cache-Control: no-store` to provide real-time status updates without stale edge caching.
- **Frontend Optimization**: Vite performs aggressive tree-shaking and manual chunking (Clerk, Gemini, React) to ensure fast initial page loads even for enterprise-scale audits.

## 4. Payment Security
- **Dynamic Key Loading**: Payment keys are loaded from environment variables and verified at runtime.
- **Secure Redirects**: All payment flows occur over HTTPS and use official SDKs (Razorpay/PayPal) to ensure PCI compliance.

## 5. Continuous Monitoring
- **Health Checks**: A public `/api/health` endpoint is available for uptime monitoring services.
- **Logging**: Critical backend errors are logged to the Vercel console for immediate troubleshooting.
