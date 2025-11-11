import * as React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import ScrollToTop from './ScrollToTop';


const LandingPage: React.FC = () => {
  
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white w-full relative overflow-hidden">
      <ScrollToTop />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 backdrop-blur-sm bg-slate-900/50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ComplyGuard AI
              </h1>
            </div>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Sign In →
              </button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-sm font-medium text-blue-300 mb-6 animate-fade-in">
              <ZapIcon className="w-4 h-4 mr-2" />
              AI-Powered Compliance Analysis
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-5xl mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform Compliance
              </span>
              <br />
              <span className="text-white">
                Into Your Competitive Edge
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Stop spending weeks on manual audits. Our AI instantly scans your policies against 
              <span className="text-blue-400 font-semibold"> GDPR, HIPAA, SOC 2</span> and more—identifying risks and providing actionable remediation in minutes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300">
              <SignInButton mode="modal">
                <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 text-lg">
                  <span className="flex items-center">
                    Start Free Trial
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </SignInButton>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-lg">
                Watch Demo
              </button>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up delay-400">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">100+</div>
                <div className="text-sm text-slate-400 mt-1">Compliance Rules</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">95%</div>
                <div className="text-sm text-slate-400 mt-1">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-slate-400 mt-1">AI Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Compliance Analysis in 3 Simple Steps</h2>
            <p className="mt-4 text-lg text-slate-600">Go from document to actionable report in minutes, not weeks. Our streamlined process makes complex compliance checks effortless.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mx-auto">
                <UploadCloudIcon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">1. Upload Document</h3>
              <p className="mt-2 text-slate-600">Securely upload your internal policies, procedures, or contracts in various formats.</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mx-auto">
                <ShieldCheckIcon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">2. Select Framework</h3>
              <p className="mt-2 text-slate-600">Choose from a library of regulatory frameworks like GDPR, HIPAA, SOC 2, and more.</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mx-auto">
                <FileTextIcon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">3. Get Instant Report</h3>
              <p className="mt-2 text-slate-600">Receive a detailed report highlighting compliance gaps, risks, and clear remediation advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Powerful Features for Modern Compliance Teams</h2>
            <p className="mt-4 text-lg text-slate-600">We provide the tools you need to build a robust and proactive compliance posture.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ZapIcon className="w-7 h-7 text-accent" />}
              title="AI-Powered Gap Analysis"
              description="Our advanced AI reads and understands your documents, comparing them against hundreds of regulatory rules to find what's missing."
            />
            <FeatureCard
              icon={<ScaleIcon className="w-7 h-7 text-accent" />}
              title="Multiple Frameworks"
              description="Stay compliant across jurisdictions. Scan against GDPR, HIPAA, SOC 2 and an ever-growing list of regulations."
            />
            <FeatureCard
              icon={<BriefcaseIcon className="w-7 h-7 text-accent" />}
              title="Actionable Remediation"
              description="Don't just find problems—fix them. Get clear, concrete advice on how to update your documents to close compliance gaps."
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="w-7 h-7 text-accent" />}
              title="Secure & Confidential"
              description="Your documents are encrypted in transit and at rest. We are built on enterprise-grade infrastructure to protect your sensitive data."
            />
             <FeatureCard
              icon={<FileTextIcon className="w-7 h-7 text-accent" />}
              title="Audit-Ready Reports"
              description="Generate professional reports that clearly document your compliance status, findings, and remediation actions for stakeholders or auditors."
            />
             <FeatureCard
              icon={<UploadCloudIcon className="w-7 h-7 text-accent" />}
              title="Centralized Document Hub"
              description="Keep all your compliance scans and reports in one organized, easily accessible dashboard."
            />
          </div>
        </div>
      </section>
      
       {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-600">Choose the plan that fits your compliance needs. Start free, upgrade as you grow.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for trying out ComplyGuard"
              features={[
                "5 document scans per month",
                "Basic compliance frameworks",
                "Email support",
                "Standard reporting"
              ]}
              buttonText="Get Started Free"
              isPopular={false}
            />
            <PricingCard
              name="Professional"
              price="$99"
              period="per month"
              description="Perfect for growing businesses"
              features={[
                "200 document scans per month",
                "All compliance frameworks",
                "Priority support + phone",
                "Advanced reporting & analytics",
                "Custom compliance rules",
                "Team collaboration",
                "API access"
              ]}
              buttonText="Start Free Trial"
              isPopular={true}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period="pricing"
              description="For large organizations"
              features={[
                "Unlimited document scans",
                "All compliance frameworks",
                "Dedicated account manager",
                "Custom integrations",
                "On-premise deployment",
                "Advanced security features",
                "Custom SLA"
              ]}
              buttonText="Contact Sales"
              isPopular={false}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Trusted by Industry Leaders</h2>
            <p className="mt-4 text-lg text-slate-600">Hear how ComplyGuard AI is transforming compliance for businesses like yours.</p>
          </div>
          <div className="mt-16 grid lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="ComplyGuard AI saved us over 100 hours in our last audit cycle. The accuracy of the gap analysis is unparalleled. It's a must-have for any compliance officer."
              author="Jane Doe"
              title="Chief Compliance Officer, TechFin Corp"
            />
            <TestimonialCard
              quote="As a startup, we don't have a large legal team. This tool gave us the confidence to launch in the EU, knowing our GDPR policies were solid. The remediation advice was incredibly helpful."
              author="John Smith"
              title="CEO & Founder, HealthNow"
            />
            <TestimonialCard
              quote="The ability to scan a contract against SOC 2 controls before signing has fundamentally changed our vendor management process. We catch risks before they become problems."
              author="Emily White"
              title="Head of Security, DataSolutions Inc."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to Automate Your Compliance?</h2>
            <p className="mt-4 max-w-2xl mx-auto">Sign in to your account and run your first scan today. Experience a smarter, faster, and more effective way to manage regulatory risk.</p>
            <div className="mt-8">
                <SignInButton mode="modal">
                    <button className="px-8 py-4 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent/90 transition-colors text-lg">
                        Get Started Now
                    </button>
                </SignInButton>
            </div>
            <p className="mt-12 text-sm text-slate-400">&copy; {new Date().getFullYear()} ComplyGuard AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex items-center justify-center h-12 w-12 bg-blue-100 rounded-lg">
            {icon}
        </div>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
);

const PricingCard: React.FC<{
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
}> = ({ name, price, period, description, features, buttonText, isPopular }) => (
  <div className={`relative bg-white p-8 rounded-2xl border-2 ${
    isPopular ? 'border-accent shadow-xl scale-105' : 'border-gray-200'
  }`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-accent text-white">
          Most Popular
        </span>
      </div>
    )}
    
    <div className="text-center">
      <h3 className="text-2xl font-bold text-slate-900">{name}</h3>
      <p className="text-slate-600 mt-2">{description}</p>
      <div className="mt-6">
        <span className="text-4xl font-bold text-slate-900">{price}</span>
        <span className="text-slate-600 ml-2">/{period}</span>
      </div>
    </div>
    
    <ul className="mt-8 space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-slate-600">{feature}</span>
        </li>
      ))}
    </ul>
    
    <div className="mt-8">
      <SignInButton mode="modal">
        <button className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-accent text-white hover:bg-accent/90'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        }`}>
          {buttonText}
        </button>
      </SignInButton>
    </div>
  </div>
);

const TestimonialCard: React.FC<{quote: string, author: string, title: string}> = ({quote, author, title}) => (
    <div className="bg-white p-8 rounded-lg border border-slate-200">
        <p className="text-slate-700">"{quote}"</p>
        <div className="mt-6">
            <p className="font-semibold text-slate-900">{author}</p>
            <p className="text-sm text-slate-500">{title}</p>
        </div>
    </div>
)


export default LandingPage;