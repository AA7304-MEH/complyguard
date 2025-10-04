import * as React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';


const LandingPage: React.FC = () => {
  
  return (
    <div className="bg-white text-slate-800">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">ComplyGuard AI</h1>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent/90 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28">
        <div className="absolute inset-0 bottom-1/2 bg-secondary"></div>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-accent font-semibold rounded-full text-sm">Automated Compliance Analysis</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mt-4 leading-tight max-w-4xl">
              Turn Compliance from a Burden into a Competitive Edge.
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
              Stop spending weeks on manual audits. ComplyGuard AI scans your policies against regulatory frameworks like GDPR, HIPAA, and SOC 2 to instantly identify risks and provide actionable remediation advice.
            </p>
            <div className="mt-8 flex justify-center gap-4">
               <SignInButton mode="modal">
                <button className="px-8 py-4 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent/90 transition-colors text-lg">
                  Get Started for Free
                </button>
              </SignInButton>
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
      
       {/* Testimonials Section */}
      <section className="py-20 bg-white">
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

const TestimonialCard: React.FC<{quote: string, author: string, title: string}> = ({quote, author, title}) => (
    <div className="bg-secondary p-8 rounded-lg border border-slate-200">
        <p className="text-slate-700">"{quote}"</p>
        <div className="mt-6">
            <p className="font-semibold text-slate-900">{author}</p>
            <p className="text-sm text-slate-500">{title}</p>
        </div>
    </div>
)


export default LandingPage;