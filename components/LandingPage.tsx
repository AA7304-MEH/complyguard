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
    const { openSignIn, openSignUp } = useClerk();
    const [publicView, setPublicView] = React.useState<'landing' | 'demo' | 'pricing' | 'privacy' | 'terms' | 'refund' | 'contact'>('landing');
    const [activeTab, setActiveTab] = React.useState<'dpdp' | 'rbi' | 'soc2'>('dpdp');
    const [currencyToggle, setCurrencyToggle] = React.useState<'inr' | 'usd'>('inr');
    const [openFaq, setOpenFaq] = React.useState<number | null>(0);

    const handleUnlock = async () => {
        if (!isLoaded) return;
        
        if (!user) {
            openSignUp();
            return;
        }

        try {
            const { CreditManager } = await import('../lib/creditManager');
            const profile = await CreditManager.getProfile(user.id, user.primaryEmailAddress?.emailAddress || '');
            
            if (profile.credits <= 0) {
                alert("You have 0 credits. Please upgrade to continue.");
                setPublicView('pricing');
                return;
            }

            const { createScan } = await import('../services/apiClient');
            await createScan(
                user.id, 
                'DPDP', 
                'Demo Compliance Content Unlocked',
                user.primaryEmailAddress?.emailAddress
            );

            alert("Success! 1 credit used. Your full report is being generated.");
            window.location.href = '/dashboard';
        } catch (err) {
            console.error("Unlock failed", err);
            alert("An error occurred while processing credits.");
        }
    };

    if (publicView !== 'landing') {
      if (['privacy', 'terms', 'refund', 'contact'].includes(publicView)) {
          return (
              <div className="bg-slate-950 text-slate-100 min-h-screen relative">
                  <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                          <button onClick={() => setPublicView('landing')} className="text-indigo-400 font-semibold flex items-center gap-2 hover:text-indigo-300 transition-colors">
                              &larr; Back to Home
                          </button>
                          <span className="font-bold text-white text-lg tracking-tight">ComplyGuard AI</span>
                      </div>
                  </header>
                  <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
                      {publicView === 'privacy' && (
                          <div className="space-y-6 text-slate-300">
                              <h1 className="text-4xl font-extrabold text-white mb-6">Privacy Policy</h1>
                              <p className="leading-relaxed">At ComplyGuard AI, we prioritize the confidentiality and security of your legal and technical documentation. This policy outlines how your audit data is processed.</p>
                              <h2 className="text-2xl font-bold text-white mt-8">1. Document Confidentiality</h2>
                              <p className="leading-relaxed">Documents uploaded for compliance auditing are processed in memory and encrypted in transit (TLS 1.3) and at rest (AES-256). We never use your proprietary policies to train public AI models.</p>
                              <h2 className="text-2xl font-bold text-white mt-8">2. Data Security & Storage</h2>
                              <p className="leading-relaxed">Audit results are tied to your encrypted user account profile. You retain 100% ownership of all generated audit reports and remediation logs.</p>
                          </div>
                      )}
                      {publicView === 'terms' && (
                          <div className="space-y-6 text-slate-300">
                              <h1 className="text-4xl font-extrabold text-white mb-6">Terms of Service</h1>
                              <p className="leading-relaxed">By utilizing ComplyGuard AI, you agree to these operational terms.</p>
                              <h2 className="text-2xl font-bold text-white mt-8">1. AI Audit Scope</h2>
                              <p className="leading-relaxed">ComplyGuard AI provides automated compliance analysis and gap recommendations based on official frameworks. While reports are engineered to regulatory standards, they serve as technical assistance and do not constitute formal legal counsel.</p>
                          </div>
                      )}
                      {publicView === 'refund' && (
                          <div className="space-y-6 text-slate-300">
                              <h1 className="text-4xl font-extrabold text-white mb-6">Refund Policy</h1>
                              <p className="leading-relaxed">We offer a 7-day money-back guarantee for first-time subscription purchases if less than 2 scan credits have been consumed.</p>
                          </div>
                      )}
                      {publicView === 'contact' && (
                          <div className="space-y-6 text-slate-300">
                              <h1 className="text-4xl font-extrabold text-white mb-6">Contact Enterprise Support</h1>
                              <div className="bg-slate-900/60 p-8 rounded-2xl border border-white/10 space-y-4">
                                  <p className="font-bold text-white text-lg">Direct Compliance Desk</p>
                                  <p className="text-indigo-400 font-mono text-base">support@complyguard.com</p>
                                  <p className="text-sm text-slate-400">Response SLA: Under 4 hours for Pro & Enterprise accounts.</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          );
      }

      return (
        <div className="bg-slate-950 min-h-screen py-10 w-full relative text-slate-100">
            <button 
                onClick={() => setPublicView('landing')}
                className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold z-50 bg-slate-900/80 px-4 py-2 rounded-full border border-white/10"
            >
                &larr; Back to Home
            </button>
            {publicView === 'demo' ? <DemoPage onGetFullAccess={handleUnlock} /> : <PricingPage onPlanSelect={() => {}} />}
        </div>
      );
    }

  return (
    <div className="bg-slate-950 text-slate-100 w-full relative overflow-hidden min-h-screen font-sans selection:bg-indigo-500 selection:text-white">
      <ScrollToTop />
      
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>

      {/* Glow Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPublicView('landing')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              ComplyGuard <span className="text-indigo-400 font-extrabold">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sample-reports" className="hover:text-white transition-colors">Sample Reports</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-98 transition-all text-sm">
                Run Free Scan &rarr;
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-400 mb-8 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
          <span>Next-Gen AI Regulatory Compliance Auditor</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] max-w-5xl mx-auto mb-8">
          Scan compliance docs in <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">60 seconds</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12">
          Get clause-level gaps, severity scores, and remediation steps for <span className="text-white font-bold">DPDP Act 2023, RBI Master Directions, SOC 2, GDPR, HIPAA</span>, and <span className="text-white font-bold">ISO 27001</span>.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16 max-w-md mx-auto">
          <SignUpButton mode="modal">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-98 transition-all text-base">
              🚀 Run Free Scan
            </button>
          </SignUpButton>
          <a href="#sample-reports" className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold rounded-full border border-white/10 hover:border-white/20 transition-all text-base flex items-center justify-center gap-2 backdrop-blur-md">
            <span>📄</span> View Sample Report
          </a>
        </div>

        {/* Hero Interactive Mockup Card */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">ComplyGuard AI Auditor v1.5 • Live Executive Report</span>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
              Overall Compliance: 85% Score
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 60-Second Executive Summary Callout */}
            <div className="md:col-span-1 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">⚡ Executive Summary</span>
                <span className="text-xs text-slate-400 font-mono">60s Scan Complete</span>
              </div>
              <h3 className="text-lg font-bold text-white">DPDP Act 2023 Privacy Policy Scan</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                2 Critical Gaps identified in Data Principal Consent and Data Protection Officer Contact Disclosures.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-indigo-500/20">
                <span className="text-slate-400">Scanned Document:</span>
                <span className="text-white font-mono">privacy_policy_v2.pdf</span>
              </div>
            </div>

            {/* Simulated Finding Preview */}
            <div className="md:col-span-2 bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-extrabold rounded-md">
                    CRITICAL
                  </span>
                  <span className="text-sm font-bold text-white">DPDP Act Section 6(1) — Consent Manager Notice</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Clause Gap #01</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Observation:</strong> The uploaded privacy notice fails to disclose the technical mechanism for users to revoke consent through an interoperable Consent Manager framework.
              </p>
              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 space-y-1 font-mono text-[11px]">
                <span className="text-emerald-400 font-bold block">💡 Developer Technical Remediation Fix:</span>
                <p className="text-slate-300">Insert Section 6(A): "Users may withdraw consent anytime via our Consent Manager API at /api/user/consent-revoke or by writing to dpo@company.com."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip & Frameworks */}
      <section className="py-12 bg-slate-900/50 border-y border-white/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Auditing 16+ Global & Regional Regulatory Frameworks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {[
              { label: '🇮🇳 DPDP Act 2023', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' },
              { label: '🏦 RBI Master Directions', color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
              { label: '🔐 SOC 2 Type II', color: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
              { label: '🇪🇺 GDPR', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
              { label: '🏥 HIPAA', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
              { label: '📋 ISO 27001', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
              { label: '💳 PCI-DSS 4.0', color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
              { label: '📈 SEBI Cyber Resilience', color: 'border-teal-500/30 bg-teal-500/10 text-teal-300' }
            ].map((fw, idx) => (
              <span key={idx} className={`px-4 py-2 rounded-full border text-xs font-extrabold shadow-sm ${fw.color}`}>
                {fw.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section id="features" className="py-24 container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Why traditional audits slow you down
          </h2>
          <p className="text-slate-400 text-lg">
            Stop spending ₹5 Lakhs and 4 weeks waiting for manual audit disclosures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Old Way */}
          <div className="bg-slate-900/40 border border-red-500/20 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                ✕
              </div>
              <h3 className="text-xl font-bold text-red-400">Traditional Compliance Audits</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span>Costs <strong>₹2,00,000 to ₹15,00,000 ($3,000–$20,000)</strong> per manual audit review.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span>Takes <strong>3 to 6 weeks</strong> of back-and-forth email legal consulting.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                <span>Produces dense legal PDFs with <strong>no actionable technical fixes</strong> for engineering teams.</span>
              </li>
            </ul>
          </div>

          {/* New Way */}
          <div className="bg-slate-900/80 border border-indigo-500/40 rounded-3xl p-8 space-y-6 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white">ComplyGuard AI Auditor</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Instant compliance scores in <strong>under 60 seconds</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Cites <strong>exact regulatory clause numbers</strong> (RBI Sec 38a, DPDP Sec 6).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Provides <strong>step-by-step developer remediation code fixes</strong> to close gaps immediately.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-900/40 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              How it works in 3 steps
            </h2>
            <p className="text-slate-400 text-lg">
              From raw documentation to executive PDF audit report in 1 minute.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-black rounded-2xl flex items-center justify-center text-xl">
                01
              </div>
              <h3 className="text-xl font-bold text-white">Upload or Paste</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Drag and drop any PDF, Word document (`.docx`), plain text, or paste your privacy policy / terms directly into the portal.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/40 text-blue-400 font-black rounded-2xl flex items-center justify-center text-xl">
                02
              </div>
              <h3 className="text-xl font-bold text-white">AI Multi-Framework Scan</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Select your target regulatory framework (DPDP, RBI, SOC2, GDPR). Our Gemini AI Auditor scans clauses and flags critical risks.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/40 text-purple-400 font-black rounded-2xl flex items-center justify-center text-xl">
                03
              </div>
              <h3 className="text-xl font-bold text-white">Export PDF & Fix Gaps</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Download a branded executive PDF audit report and apply pre-written technical remediation code fixes instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Reports Showcase */}
      <section id="sample-reports" className="py-24 container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Interactive Sample Audit Reports
          </h2>
          <p className="text-slate-400 text-lg">
            Preview the exact audit output produced across major frameworks.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-3 mb-10">
          <button 
            onClick={() => setActiveTab('dpdp')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'dpdp' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            🇮🇳 DPDP Act 2023 Report
          </button>
          <button 
            onClick={() => setActiveTab('rbi')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'rbi' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            🏦 RBI Master Directions Report
          </button>
          <button 
            onClick={() => setActiveTab('soc2')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'soc2' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            🔐 SOC 2 Type II Report
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-6">
          {activeTab === 'dpdp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">DPDP Act 2023 Compliance Audit</h3>
                  <p className="text-xs text-slate-400">Scanned: privacy_notice_2026.pdf</p>
                </div>
                <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 font-black rounded-full text-sm">
                  82% Score
                </span>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">CRITICAL</span>
                    <span className="text-xs text-slate-400">Section 6(1) Data Consent Manager</span>
                  </div>
                  <p className="text-xs text-slate-300">Privacy notice does not specify interoperable consent withdrawal mechanism.</p>
                  <p className="text-xs text-emerald-400 font-mono">Fix: Add clause 6.B providing /api/user/consent-revoke webhook endpoint.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rbi' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">RBI Master Direction — KYC Audit</h3>
                  <p className="text-xs text-slate-400">Scanned: customer_onboarding_policy.pdf</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 font-black rounded-full text-sm">
                  91% Score
                </span>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-yellow-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">MEDIUM</span>
                    <span className="text-xs text-slate-400">Section 38(a) Video CIP Archival</span>
                  </div>
                  <p className="text-xs text-slate-300">V-CIP recording storage duration is listed as 3 years instead of mandatory 5 years.</p>
                  <p className="text-xs text-emerald-400 font-mono">Fix: Update retention policy text from 36 months to 60 months in Section 4.2.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'soc2' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">SOC 2 Type II Gap Analysis</h3>
                  <p className="text-xs text-slate-400">Scanned: internal_security_policy.docx</p>
                </div>
                <span className="px-4 py-1.5 bg-purple-500/20 text-purple-400 font-black rounded-full text-sm">
                  88% Score
                </span>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">HIGH</span>
                    <span className="text-xs text-slate-400">CC6.1 Access Controls & MFA</span>
                  </div>
                  <p className="text-xs text-slate-300">MFA is required for production databases but not enforced for developer portal logins.</p>
                  <p className="text-xs text-emerald-400 font-mono">Fix: Enforce SSO + TOTP MFA policy across all internal developer subdomains.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900/40 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-lg">
              Start with 3 free scans. Upgrade when you're ready.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex items-center p-1.5 bg-slate-950 border border-white/10 rounded-full mb-16">
            <button 
              onClick={() => setCurrencyToggle('inr')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                currencyToggle === 'inr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 Domestic (INR ₹)
            </button>
            <button 
              onClick={() => setCurrencyToggle('usd')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                currencyToggle === 'usd' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌍 International (USD $)
            </button>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto text-left">
            {/* Free Trial */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Free Trial</h3>
                <p className="text-xs text-slate-400 mb-6">Perfect for instant policy checks</p>
                <div className="text-3xl font-black text-white mb-6">
                  {currencyToggle === 'inr' ? '₹0' : '$0'}
                  <span className="text-xs text-slate-400 font-normal"> / forever</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li>✓ 3 Initial Scan Credits</li>
                  <li>✓ Basic Gap Analysis</li>
                  <li>✓ Sample Framework Access</li>
                </ul>
              </div>
              <SignUpButton mode="modal">
                <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all">
                  Start Free Trial
                </button>
              </SignUpButton>
            </div>

            {/* Basic */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Basic Plan</h3>
                <p className="text-xs text-slate-400 mb-6">For growing startups & teams</p>
                <div className="text-3xl font-black text-white mb-6">
                  {currencyToggle === 'inr' ? '₹799' : '$29'}
                  <span className="text-xs text-slate-400 font-normal"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li>✓ 25 Scan Credits / month</li>
                  <li>✓ All Global Frameworks</li>
                  <li>✓ Executive PDF Export</li>
                </ul>
              </div>
              <SignUpButton mode="modal">
                <button className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all">
                  Choose Basic
                </button>
              </SignUpButton>
            </div>

            {/* Professional */}
            <div className="bg-slate-900 p-8 rounded-3xl border-2 border-indigo-500 relative shadow-2xl shadow-indigo-500/20 flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </span>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Professional</h3>
                <p className="text-xs text-slate-400 mb-6">For FinTechs & regulated entities</p>
                <div className="text-3xl font-black text-white mb-6">
                  {currencyToggle === 'inr' ? '₹1,999' : '$79'}
                  <span className="text-xs text-slate-400 font-normal"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-200">
                  <li>✓ 100 Scan Credits / month</li>
                  <li>✓ <strong>All Indian (RBI, DPDP, SEBI, IRDAI) + Global Frameworks</strong></li>
                  <li>✓ Step-by-Step Technical Remediation</li>
                  <li>✓ PDF Export + Priority Support</li>
                </ul>
              </div>
              <SignUpButton mode="modal">
                <button className="w-full mt-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all">
                  Get Professional
                </button>
              </SignUpButton>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Enterprise</h3>
                <p className="text-xs text-slate-400 mb-6">For large organizations & legal firms</p>
                <div className="text-3xl font-black text-white mb-6">
                  Custom
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li>✓ Unlimited Scans</li>
                  <li>✓ Custom Framework Builder</li>
                  <li>✓ Dedicated API Access</li>
                  <li>✓ Dedicated Account Manager</li>
                </ul>
              </div>
              <button 
                onClick={() => setPublicView('contact')}
                className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
              >
                Contact Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ComplyGuard AI */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Built for security, speed & trust
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/10 space-y-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-lg">⚡</div>
            <h3 className="text-lg font-bold text-white">60-Second Instant Scans</h3>
            <p className="text-xs text-slate-400 leading-relaxed">No software installation required. Upload any document and get clause-level results immediately.</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/10 space-y-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-bold text-lg">🎯</div>
            <h3 className="text-lg font-bold text-white">Exact Regulatory Citations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Every gap references official legal sections (RBI Master Directions, DPDP Act 2023, SOC 2 CC criteria).</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/10 space-y-3">
            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center font-bold text-lg">🌐</div>
            <h3 className="text-lg font-bold text-white">Dual Geo-Payment Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Seamless automatic routing for domestic Indian payments (Razorpay UPI) and international cards (PayPal).</p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-24 bg-slate-900/40 border-t border-white/10">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does ComplyGuard AI analyze my compliance documents?",
                a: "ComplyGuard AI processes uploaded PDF/Word documents using rotated Gemini AI models instructed with exact regulatory framework definitions. It evaluates clauses, identifies missing requirements, and generates risk severity scores."
              },
              {
                q: "Is my uploaded documentation kept private?",
                a: "Yes. All uploads are processed securely in memory and encrypted using TLS 1.3 in transit and AES-256 at rest. Proprietary documentation is never used to train public models."
              },
              {
                q: "Which Indian regulatory frameworks are supported?",
                a: "We support DPDP Act 2023, RBI KYC Master Directions, RBI PA/PG Guidelines, RBI Cyber Security Framework, RBI PPI, PMLA 2002, FEMA, SEBI Cyber Resilience, and IRDAI Guidelines."
              },
              {
                q: "How does payment work for Indian vs International users?",
                a: "Our system automatically detects your region. Indian users pay in ₹ INR via Razorpay (UPI, GPay, Cards, NetBanking), while international users pay in $ USD via PayPal."
              },
              {
                q: "Can I export reports for external auditors or clients?",
                a: "Yes! All plans include executive PDF export capabilities suitable for board meetings, external legal review, and enterprise buyer security questionnaires."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-950 rounded-2xl border border-white/10 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left font-bold text-white flex justify-between items-center text-sm md:text-base"
                >
                  <span>{item.q}</span>
                  <span className="text-indigo-400 text-xl">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final High-Impact CTA */}
      <section className="py-24 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-900/60 via-blue-900/60 to-purple-900/60 border border-indigo-500/40 rounded-3xl p-12 backdrop-blur-xl shadow-2xl shadow-indigo-500/20 space-y-8">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Ready to scan your compliance docs in 60 seconds?
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
            Join 500+ fintechs, SaaS founders, and compliance leads automating audits with ComplyGuard AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-black rounded-full shadow-xl hover:bg-slate-100 hover:scale-[1.03] active:scale-98 transition-all text-base">
                🚀 Run Free Scan Now
              </button>
            </SignUpButton>
            <button 
              onClick={() => setPublicView('contact')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-950/80 hover:bg-slate-900 text-white font-bold rounded-full border border-white/20 transition-all text-base"
            >
              Book Enterprise Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-left">
                <div>
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">ComplyGuard AI</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                        The AI-powered regulatory compliance auditing platform for FinTechs and SaaS companies.
                    </p>
                </div>
                
                <div>
                    <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Platform</h3>
                    <ul className="space-y-3 text-xs">
                        <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#sample-reports" className="hover:text-white transition-colors">Sample Reports</a></li>
                        <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                        <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Legal</h3>
                    <ul className="space-y-3 text-xs">
                        <li><button onClick={() => setPublicView('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                        <li><button onClick={() => setPublicView('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                        <li><button onClick={() => setPublicView('refund')} className="hover:text-white transition-colors">Refund Policy</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Support</h3>
                    <ul className="space-y-3 text-xs">
                        <li><button onClick={() => setPublicView('contact')} className="hover:text-white transition-colors">Contact Enterprise Team</button></li>
                        <li><p className="text-slate-400">support@complyguard.com</p></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <p>&copy; {new Date().getFullYear()} ComplyGuard AI. All rights reserved.</p>
                <p className="text-slate-500">Built for speed, accuracy, and enterprise trust.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;