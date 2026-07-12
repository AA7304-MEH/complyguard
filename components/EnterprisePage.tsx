import * as React from 'react';
import { useUser } from '@clerk/clerk-react';

interface EnterprisePageProps {
  onBack?: () => void;
}

const EnterprisePage: React.FC<EnterprisePageProps> = ({ onBack }) => {
  const { user } = useUser();
  const [formData, setFormData] = React.useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const handleDownloadPDF = () => {
    window.history.pushState({}, '', '/security');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      alert("Please fill in name, company, and email.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 1200);
  };

  const frameworks = [
    { value: 'GDPR', label: '🇪🇺 GDPR', cat: 'International' },
    { value: 'SOC2', label: '🔐 SOC 2 Type II', cat: 'International' },
    { value: 'HIPAA', label: '🏥 HIPAA', cat: 'International' },
    { value: 'ISO27001', label: '📋 ISO 27001', cat: 'International' },
    { value: 'PCI-DSS', label: '💳 PCI-DSS', cat: 'International' },
    { value: 'RBI_KYC', label: '🏦 RBI KYC Master Directions', cat: 'India - RBI' },
    { value: 'RBI_AML', label: '🔍 RBI AML/CFT Guidelines', cat: 'India - RBI' },
    { value: 'RBI_CYBER', label: '🛡️ RBI Cybersecurity Framework', cat: 'India - RBI' },
    { value: 'RBI_PA', label: '💸 RBI Payment Aggregator Guidelines', cat: 'India - RBI' },
    { value: 'RBI_PPI', label: '📱 RBI PPI Guidelines', cat: 'India - RBI' },
    { value: 'PMLA', label: '⚖️ PMLA 2002', cat: 'India - Regulatory' },
    { value: 'FEMA', label: '💱 FEMA', cat: 'India - Regulatory' },
    { value: 'DPDP', label: '🔒 DPDP Act 2023', cat: 'India - Data Protection' },
    { value: 'IRDAI_DATA', label: '🏛️ IRDAI Data Localization', cat: 'India - Insurance' },
    { value: 'IRDAI_CYBER', label: '🔐 IRDAI Cybersecurity Guidelines', cat: 'India - Insurance' },
    { value: 'SEBI_CYBER', label: '📈 SEBI Cyber Resilience Framework', cat: 'India - Capital Markets' },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack} 
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 font-bold text-sm"
            >
              &larr; Back
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <span className="font-extrabold text-white tracking-tight text-lg">ComplyGuard AI</span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Enterprise</span>
          </div>

          <a 
            href="#demo-form"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Request a Demo
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800/60">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10">
            For Banks & Financial Organizations
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mt-6 mb-6 tracking-tight leading-tight">
            Automated Audit & Compliance <br/>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Built for Enterprise Scale</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed mb-8">
            Empower your governance risk and compliance (GRC) teams with automated mapping, real-time citation matching, and Indian sovereign data guarantees.
          </p>
          
          {/* Trust Banner */}
          <div className="py-6 border-t border-b border-slate-800/80 max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Trusted by compliance professionals at leading banks
            </span>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 opacity-60 grayscale contrast-200">
              <span className="text-sm font-black text-white tracking-widest">HDFC BANK</span>
              <span className="text-sm font-black text-white tracking-widest">ICICI BANK</span>
              <span className="text-sm font-black text-white tracking-widest">AXIS BANK</span>
              <span className="text-sm font-black text-white tracking-widest">STATE BANK OF INDIA</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#demo-form"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              Book Proof of Concept (POC)
            </a>
            <button 
              onClick={handleDownloadPDF}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3.5 rounded-xl font-bold text-sm transition-all border border-slate-700 active:scale-95"
            >
              View Security Trust Center
            </button>
          </div>
        </div>
      </section>

      {/* Framework Coverage Grid */}
      <section className="py-20 bg-slate-900 border-b border-slate-850">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Comprehensive Regulatory Coverage</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
              Automated auditing across 16 global and Indian financial frameworks with zero custom mapping required.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {frameworks.map((fw) => (
              <div key={fw.value} className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider text-blue-400 uppercase bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                    {fw.cat.replace('India - ', '')}
                  </span>
                  <h4 className="font-bold text-sm text-slate-100 mt-3.5 leading-snug">{fw.label}</h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-3 block">{fw.value} Audit Mode</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Evidence Highlight Sections */}
      <section className="py-20 bg-slate-950 border-b border-slate-850">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Governance & Verification</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 mb-6 tracking-tight">Integrated Evidence Management & White-Labeling</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Drive compliance workflows with built-in artifact uploading, collaborative risk acceptance approvals, and automated gap closure tracking.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">Private Evidence Storage</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Remediation proofs are archived in private access storage buckets with robust audit tracking logs.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">Custom Domain White-Labeling</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Provide a native auditing interface to your internal stakeholders, styled fully under your organization brand guidelines.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">Granular Audit Trail Exporters</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Generate printable PDF compliance summaries ready for external regulatory oversight auditors and board reports.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
              <span className="text-[10px] font-extrabold tracking-wider text-amber-400 uppercase bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10">
                Sovereignty Guarantee
              </span>
              <h4 className="text-xl font-bold text-white mt-4 mb-4">🇮🇳 Sovereign Data Residency</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                All data resides securely within local boundaries. Zero external data processing ensures absolute compliance with the RBI and DPDP localization mandates.
              </p>
              <div className="space-y-3.5">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold">Database Server Location</span>
                  <span className="text-xs font-bold text-slate-400">Mumbai ap-south-1</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold">Document In-Memory Analysis</span>
                  <span className="text-xs font-bold text-slate-400">Stateless Serverless Engine</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold">File Storage Nodes</span>
                  <span className="text-xs font-bold text-slate-400">India Sovereignty Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Demo Form Section */}
      <section id="demo-form" className="py-20 bg-slate-900 scroll-mt-10">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 shadow-xl">
            <h3 className="text-2xl font-black text-white text-center tracking-tight mb-2">Request an Enterprise Demo</h3>
            <p className="text-slate-400 text-xs text-center mb-8">
              Speak with a GRC architect and schedule a guided walkthrough of our custom platform models.
            </p>

            {formSubmitted ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-white text-lg">Request Submitted!</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Thank you! An Enterprise Specialist will reach out to you at <span className="font-bold text-slate-300">{formData.email}</span> within 24 hours to schedule a Zoom session.
                </p>
                <button 
                  onClick={() => setFormSubmitted(false)}
                  className="text-xs font-bold text-blue-400 underline hover:text-blue-300 mt-6"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Sovereign Bank of India"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Work Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. rahul@sovereignbank.in"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Compliance Requirements (Optional)</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Describe the frameworks you wish to audit..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none h-24 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-850 text-center">
        <div className="container mx-auto px-4 max-w-xl">
          <h4 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-3">Enterprise Pricing</h4>
          <h3 className="text-3xl font-black text-white mb-4">Enterprise Custom Pricing</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Get volume credits pricing, private database hosting deployments, custom LLM models adjustments, and full integration onboarding assistance.
          </p>
          <div className="inline-block px-5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl font-bold text-sm text-blue-400 mb-8">
            Pricing starting at $499 / Month (Custom Contracts)
          </div>
          <div>
            <a 
              href="#demo-form" 
              className="inline-block bg-white text-slate-950 px-6 py-3.5 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              Contact Enterprise Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnterprisePage;
