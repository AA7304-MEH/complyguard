import * as React from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser, useClerk } from '@clerk/clerk-react';
import ReportPage from './ReportPage';
import DemoPage from './DemoPage';
import PricingPage from './PricingPage';
import { AuditScan, AuditStatus, FindingSeverity, SubscriptionPlan, BillingCycle } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import ScrollToTop from './ScrollToTop';

const LandingPage: React.FC = () => {
    const { user, isLoaded } = useUser();
    const { openSignIn } = useClerk();
    const [publicView, setPublicView] = React.useState<'landing' | 'demo' | 'pricing' | 'privacy' | 'terms' | 'refund' | 'contact'>('landing');
    const [unlockedScan, setUnlockedScan] = React.useState<AuditScan | null>(null);

    const handleUnlock = async () => {
        if (!isLoaded) return;
        
        if (!user) {
            openSignIn();
            return;
        }

        // Check and consume credits
        try {
            const { CreditManager } = await import('../lib/creditManager');
            const profile = await CreditManager.getProfile(user.id, user.primaryEmailAddress?.emailAddress || '');
            
            if (profile.credits <= 0) {
                alert("You have 0 credits. Please upgrade to continue.");
                setPublicView('pricing');
                return;
            }

            // Create a real scan from the demo text! (This will consume a credit)
            const { createScan } = await import('../services/apiClient');
            const newScan = await createScan(
                user.id, 
                'GDPR', 
                unlockedScan?.result ? JSON.stringify(unlockedScan.result) : 'Demo Content Unlocked',
                user.primaryEmailAddress?.emailAddress
            );

            alert("Success! 1 credit used. Your full report is being generated.");
            window.location.href = '/dashboard'; // Force refresh to dashboard
        } catch (err) {
            console.error("Unlock failed", err);
            alert("An error occurred while processing credits.");
        }
    };

    if (publicView !== 'landing') {
      // Special handling for legal/contact pages
      if (['privacy', 'terms', 'refund', 'contact'].includes(publicView)) {
          return (
              <div className="bg-white text-slate-900 min-h-screen relative">
                  <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
                      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                          <button onClick={() => setPublicView('landing')} className="text-accent font-medium flex items-center gap-2">
                              &larr; Back to Home
                          </button>
                          <span className="font-bold text-slate-900">ComplyGuard AI</span>
                      </div>
                  </header>
                  <div className="pt-24 pb-20">
                      {publicView === 'privacy' && (
                          <div className="max-w-4xl mx-auto px-4">
                              <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                              <div className="space-y-6 text-slate-600">
                                  <p>At ComplyGuard AI, we prioritize the security and privacy of your data. This policy outlines how we handle your information.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">1. Data Collection</h2>
                                  <p>We collect document text uploaded for analysis, user email addresses for account management, and device identifiers to prevent fraud.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">2. Data Security</h2>
                                  <p>All documents are encrypted in transit and at rest. We do not use your proprietary data to train global AI models without explicit permission.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">3. Contact</h2>
                                  <p>For privacy concerns, contact privacy@complyguard.com.</p>
                              </div>
                          </div>
                      )}
                      {publicView === 'terms' && (
                          <div className="max-w-4xl mx-auto px-4">
                              <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                              <div className="space-y-6 text-slate-600">
                                  <p>By using ComplyGuard AI, you agree to these terms. Please read them carefully.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">1. Service Description</h2>
                                  <p>ComplyGuard provides AI-powered compliance analysis. The reports generated are for informational purposes and do not constitute legal advice.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">2. Usage Limits</h2>
                                  <p>Users are responsible for maintaining the confidentiality of their account and for all activities that occur under their account.</p>
                              </div>
                          </div>
                      )}
                      {publicView === 'refund' && (
                          <div className="max-w-4xl mx-auto px-4">
                              <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
                              <div className="space-y-6 text-slate-600">
                                  <h2 className="text-xl font-semibold text-slate-900">1. Cancellations</h2>
                                  <p>Subscriptions can be cancelled at any time. Your access will continue until the end of your current billing cycle.</p>
                                  <h2 className="text-xl font-semibold text-slate-900">2. Refunds</h2>
                                  <p>We offer a 7-day money-back guarantee for new users who have not utilized more than 1 scan credit. Refunds are processed within 5-7 business days.</p>
                              </div>
                          </div>
                      )}
                      {publicView === 'contact' && (
                          <div className="max-w-4xl mx-auto px-4">
                              <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
                              <div className="space-y-6 text-slate-600">
                                  <p>Need help or have questions? Our support team is ready to assist you.</p>
                                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                      <p className="font-semibold text-slate-900 mb-1">Email Support</p>
                                      <p className="text-accent mb-4">support@complyguard.com</p>
                                      <p className="font-semibold text-slate-900 mb-1">Registered Address</p>
                                      <p>AI Innovation Hub, Block 4, Tech Park, Bangalore, KA, India - 560001</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          );
      }

      return (
        <div className="bg-slate-50 min-h-screen py-10 w-full relative text-slate-900">
            <button 
                onClick={() => setPublicView('landing')}
                className="absolute top-6 left-6 text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 font-medium z-50"
            >
                &larr; Back to Home
            </button>
            {publicView === 'demo' ? <DemoPage onGetFullAccess={handleUnlock} /> : <PricingPage onPlanSelect={() => {}} />}
        </div>
      );
    }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white w-full relative overflow-hidden">
      <ScrollToTop />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
                Compliance Audits
              </span>
              <br />
              <span className="text-white">
                In Seconds, Not Weeks
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Transform your legal and security documents into actionable compliance reports. Our AI Auditor finds gaps in 
              <span className="text-blue-400 font-semibold"> GDPR, HIPAA, and SOC 2</span> instantly.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300">
              <SignUpButton mode="modal">
                <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 text-lg">
                  Start Free Trial
                </button>
              </SignUpButton>
              <button 
                onClick={() => setPublicView('demo')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-2"
              >
                <span>⚡</span> Run Interactive Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ZapIcon className="w-7 h-7 text-accent" />}
              title="Instant Gap Analysis"
              description="Upload your policy and get a detailed breakdown of missing clauses and risks in real-time."
            />
            <FeatureCard
              icon={<ScaleIcon className="w-7 h-7 text-accent" />}
              title="Global Frameworks"
              description="Full support for GDPR, HIPAA, SOC 2, ISO 27001, and custom enterprise checklists."
            />
            <FeatureCard
              icon={<BriefcaseIcon className="w-7 h-7 text-accent" />}
              title="Auto-Remediation"
              description="Get AI-generated legal clause suggestions to fix compliance gaps immediately."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-left">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">ComplyGuard</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                        The world's first AI-powered compliance auditor. Secure your business in seconds.
                    </p>
                </div>
                
                <div>
                    <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Platform</h3>
                    <ul className="space-y-4 text-sm">
                        <li><button onClick={() => setPublicView('demo')} className="hover:text-white transition-colors">Interactive Demo</button></li>
                        <li><button onClick={() => setPublicView('pricing')} className="hover:text-white transition-colors">Pricing Plans</button></li>
                        <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">Features</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Legal</h3>
                    <ul className="space-y-4 text-sm flex flex-col items-start">
                        <li><button onClick={() => setPublicView('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                        <li><button onClick={() => setPublicView('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                        <li><button onClick={() => setPublicView('refund')} className="hover:text-white transition-colors">Refund Policy</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Support</h3>
                    <ul className="space-y-4 text-sm">
                        <li><button onClick={() => setPublicView('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                        <li><p>support@complyguard.com</p></li>
                        <li><p>Bangalore, India</p></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <p>&copy; {new Date().getFullYear()} ComplyGuard AI. All rights reserved.</p>
                <p className="text-slate-500 italic">Trusted by 500+ legal teams globally.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-center h-12 w-12 bg-blue-100 rounded-xl mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
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