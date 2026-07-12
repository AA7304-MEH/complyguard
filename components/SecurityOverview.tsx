import * as React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

interface SecurityOverviewProps {
  onBack?: () => void;
}

const SecurityOverview: React.FC<SecurityOverviewProps> = ({ onBack }) => {
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const handleCTA = () => {
    if (user) {
      window.history.pushState({}, '', '/');
    } else {
      openSignIn();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          header, button, nav, .no-print {
            display: none !important;
          }
          body, html, #root {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          section {
            page-break-inside: avoid;
            margin-bottom: 2rem !important;
            border: 1px solid #e2e8f0 !important;
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}} />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack} 
              className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 font-bold text-sm"
            >
              &larr; Back
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="font-extrabold text-slate-950 tracking-tight text-lg">ComplyGuard AI</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-100">Trust Center</span>
          </div>

          <button 
            onClick={handleCTA}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/10 active:scale-95"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-4xl pt-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 mb-4 tracking-tight">
            Security & Trust Center
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade compliance auditing with absolute data security and strict regulatory compliance.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button 
              onClick={handlePrint}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Security Overview PDF
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Data Residency Card */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
                🇮🇳
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Data Residency & Localization</h2>
                <p className="text-slate-400 text-xs mt-0.5">Strict compliance with local sovereignty directives</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              ComplyGuard AI fully complies with local data sovereignty mandates, including the RBI data localization directives and the Digital Personal Data Protection (DPDP) Act. All data storage, hosting, and computations are housed exclusively within geography boundaries.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Database Hosting</span>
                <p className="text-sm font-bold text-slate-800 mt-1">Supabase Mumbai Region (ap-south-1)</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">File Storage</span>
                <p className="text-sm font-bold text-slate-800 mt-1">Supabase Storage — India Nodes</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Edge Execution</span>
                <p className="text-sm font-bold text-slate-800 mt-1">Vercel India Edge Server Nodes</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">RBI Compliance</span>
                <p className="text-sm font-bold text-slate-800 mt-1">100% compliant data localization</p>
              </div>
            </div>
          </section>

          {/* Encryption Card */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Cryptographic Protections</h2>
                <p className="text-slate-400 text-xs mt-0.5">Protecting data at rest and in transit</p>
              </div>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Advanced Storage Encryption</h4>
                  <p className="text-slate-500 text-xs mt-0.5">All customer databases and document storage buckets utilize AES-256 standard encryption keys.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">TLS 1.3 Transport Encryption</h4>
                  <p className="text-slate-500 text-xs mt-0.5">All client-server traffic, API endpoints, and web sockets are secured via strong TLS 1.3 encryption protocols.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Server-Side Credentials Isolation</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Database keys, payment secrets, and LLM access configurations are restricted server-side and never loaded into the client runtime.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Tokenized Checkout Transactions</h4>
                  <p className="text-slate-500 text-xs mt-0.5">No debit/credit card details or net-banking credentials touch our servers. Payments are tokenized natively using SDKs from Razorpay and PayPal.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Access Control Card */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0zm21-2v2m0 0v2m0-2h2m-2 0h-2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Access Management & Guardrails</h2>
                <p className="text-slate-400 text-xs mt-0.5">Robust identity protection and granular permissions</p>
              </div>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Clerk Authentication with MFA</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Secure employee and auditor logins backed by multi-factor authentication (MFA), active session monitoring, and identity verification.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Strict Row-Level Security (RLS)</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Database access is protected by strict RLS policies. Organization users can only read, insert, or modify records belonging directly to their own account.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Granular Audit Logging</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Every administrative action, compliance finding override, or evidence upload triggers an immutable entry in the system audit trail.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Document Processing Card */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Document Processing Policies</h2>
                <p className="text-slate-400 text-xs mt-0.5">Safeguarding upload analysis metadata</p>
              </div>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Stateless In-Memory Analysis</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Document text uploaded for standard audits is processed immediately in-memory by our secure API engine and is not stored permanently on disc.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Zero Global Model Training</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Our API configurations strictly ensure that your uploaded policies, compliance records, and evidence files are never used to train the base LLMs.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Private Storage Buckets</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Evidence documents uploaded to prove remediation are stored in segregated, non-public storage buckets requiring token auth.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Compliance Status Card */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Compliance & Certifications</h2>
                <p className="text-slate-400 text-xs mt-0.5">Verified alignment with regulatory policies</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">GDPR (Article 32 Compliance)</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">ACTIVE ✅</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">RBI Data Localization Directive</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">ACTIVE ✅</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">Zero Third-Party Data Sharing</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">CONFIRMED ✅</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-bold text-slate-800">SOC 2 Type II Certification</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">IN PROGRESS 🔄</span>
              </div>
            </div>
          </section>

          {/* Security Contact Card */}
          <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-8 shadow-md">
            <h3 className="text-xl font-extrabold mb-2">Have security questions or need to report a bug?</h3>
            <p className="text-blue-200 text-sm leading-relaxed mb-6">
              Our specialized InfoSec response team handles all security audits, vulnerability disclosures, custom enterprise questionnaire assessments, and Data Processing Agreements (DPA).
            </p>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:security@complyguard.ai" className="font-bold text-blue-300 hover:text-white underline transition-colors">
                security@complyguard.ai
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SecurityOverview;
