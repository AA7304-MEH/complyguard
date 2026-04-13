# ComplyGuard AI - SaaS Compliance Platform

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

ComplyGuard AI is a comprehensive SaaS platform that automates compliance document analysis using AI. Upload your policies, select a regulatory framework (GDPR, HIPAA, SOC 2), and get instant compliance gap analysis with actionable remediation advice.

## 🚀 Features

### Core Functionality
- **AI-Powered Document Analysis**: Uses Google Gemini AI to analyze compliance documents
- **Multiple Frameworks**: Support for GDPR, HIPAA, SOC 2, and more
- **Instant Gap Analysis**: Identifies compliance gaps with severity ratings
- **Actionable Remediation**: Provides specific advice to fix compliance issues
- **Professional Reports**: Generate audit-ready compliance reports

### SaaS Features
- **Subscription Management**: Multiple pricing tiers (Free, Basic, Professional, Enterprise)
- **Payment Integration**: Razorpay for Indian customers, PayPal for international
- **Usage Tracking**: Monitor document scan limits and usage
- **User Authentication**: Secure authentication via Clerk
- **Responsive Dashboard**: Modern, mobile-friendly interface

## 💰 Pricing Plans

| Plan | Price (USD) | Price (INR) | Scans/Month | Features |
|------|-------------|-------------|-------------|----------|
| **Free** | $0 | ₹0 | 5 | Basic frameworks, Email support |
| **Basic** | $29 | ₹2,400 | 50 | All frameworks, API access, Priority support |
| **Professional** | $99 | ₹8,200 | 200 | Advanced analytics, Team collaboration, Custom rules |
| **Enterprise** | Custom | Custom | Unlimited | Dedicated support, Custom integrations, On-premise |

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **AI**: Google Gemini API
- **Payments**: Razorpay (India) + PayPal (International)
- **Icons**: Custom SVG components

## 📋 Prerequisites

- Node.js (v20.19.0 or higher recommended)
- npm or yarn
- Gemini API key
- Clerk account (for authentication)
- Razorpay account (for Indian payments)
- PayPal developer account (for international payments)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/AA7304-MEH/complyguard.git
cd complyguard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the `.env.local` file and configure your API keys:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Payment Providers
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_ENVIRONMENT=sandbox
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Gemini AI Setup
1. Get your API key from [Google AI Studio](https://aistudio.google.com/)
2. Add it to your `.env.local` file
3. The key is securely injected at build time

### Clerk Authentication
1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Add your publishable key to `.env.local`
3. Configure sign-in/sign-up flows in the Clerk dashboard

### Payment Integration

#### Razorpay (Indian Payments)
1. Create account at [razorpay.com](https://razorpay.com)
2. Get your Key ID and Key Secret
3. Create subscription plans in Razorpay dashboard
4. Update plan IDs in `config/subscriptionPlans.ts`

#### PayPal (International Payments)
1. Create developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a new application
3. Get Client ID and Client Secret
4. Set environment to 'sandbox' for testing, 'production' for live

## 📁 Project Structure

```
complyguard/
├── components/              # React components
│   ├── common/             # Reusable components
│   ├── icons/              # SVG icon components
│   ├── Dashboard.tsx       # Main dashboard
│   ├── PricingPage.tsx     # Subscription plans
│   ├── PaymentCheckout.tsx # Payment processing
│   └── ...
├── config/                 # Configuration files
│   └── subscriptionPlans.ts # Pricing plans config
├── services/               # Business logic
│   ├── apiClient.ts        # API communication
│   ├── geminiService.ts    # AI integration
│   ├── paymentService.ts   # Payment processing
│   └── mockData.ts         # Sample data
├── types.ts               # TypeScript definitions
├── App.tsx               # Main application
└── index.tsx            # Entry point
```

## 🔒 Security Features

- **Environment Variables**: Sensitive keys are never exposed to the frontend
- **Build-time Injection**: API keys are injected securely during build
- **Git Protection**: `.env.local` files are excluded from version control
- **Encrypted Payments**: All payment data is processed securely via providers
- **Authentication**: Secure user management via Clerk

## 🚀 Deployment

The application is optimized for both **Netlify** and **Vercel**.

### Vercel Deployment (Recommended)
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.production`.
4. The `vercel.json` file handles all SPA routing automatically.

For detailed steps, refer to [VERCEL_DEPLOYMENT_GUIDE](file:///C:/Users/user/.gemini/antigravity/brain/1d5170c2-7b3a-49e4-a54c-1d5658a62842/vercel_deployment_guide.md).

### Netlify Deployment
1. Connect your GitHub repo to Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Add environment variables.

This project is configured for automatic deployment via GitHub Actions:

1. **Push to GitHub** → Triggers automatic build and deployment
2. **GitHub Actions** → Builds the production bundle
3. **Netlify** → Deploys to global CDN

**Quick Setup:**
- See [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) for 3-minute setup
- See [GITHUB_DEPLOYMENT_GUIDE.md](GITHUB_DEPLOYMENT_GUIDE.md) for detailed instructions

### Manual Build for Production
```bash
npm run build
```

### Environment Variables for Production
Set these in your Netlify dashboard (Site settings → Environment variables):
- `VITE_GEMINI_API_KEY` - Your Gemini API key
- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `VITE_RAZORPAY_KEY_ID` - Your Razorpay key ID
- `VITE_PAYPAL_CLIENT_ID` - Your PayPal client ID
- `VITE_PAYPAL_ENVIRONMENT=production` - Set to production for live payments

### Deployment Features
- ✅ Automatic deployment on push to main
- ✅ Preview deployments for pull requests
- ✅ Global CDN distribution
- ✅ Automatic HTTPS/SSL
- ✅ Asset optimization and caching
- ✅ Security headers configured

## 🧪 Testing Payments

### Razorpay Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- Use any future date for expiry and any 3-digit CVV

### PayPal Sandbox
- Use PayPal sandbox accounts for testing
- Test both credit card and PayPal account payments

## 📊 Usage Analytics

The platform tracks:
- Document scans per user per month
- Subscription tier usage
- Payment success/failure rates
- Feature adoption metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Email**: Contact support for enterprise inquiries

## 🔮 Roadmap

- [ ] Additional compliance frameworks (ISO 27001, PCI DSS)
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Mobile application
- [ ] Multi-language support

---

**Built with ❤️ for compliance professionals worldwide**

