import * as React from 'react';
import ScrollToTop from './ScrollToTop';

const HelpPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen text-slate-800">
      <ScrollToTop />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={onBack} className="text-accent hover:underline mb-8 font-medium">
          &larr; Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold mb-4 text-slate-900">Help & Support</h1>
        <p className="text-lg text-slate-600 mb-12">Find answers to common questions and learn how to get the most out of ComplyGuard AI.</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-2">Frequently Asked Questions</h2>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">How accurate is the AI auditor?</h3>
                    <p className="mt-2 text-slate-600">ComplyGuard uses Google's advanced Gemini 1.5 Pro model with a specialized strict compliance persona. While highly accurate at identifying missing clauses against standard frameworks, it is intended to assist—not replace—professional legal review.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">What happens if the system is overloaded?</h3>
                    <p className="mt-2 text-slate-600">If you run out of instant processing quota, your scan will be automatically placed in our secure background queue. You do not need to resubmit; check your dashboard in a few minutes to see the completed report.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Is my data secure?</h3>
                    <p className="mt-2 text-slate-600">Yes. Documents are encrypted during transit and processing. We do not use your private policy documents to train any AI models.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">How do I interpret the Compliance Score?</h3>
                    <p className="mt-2 text-slate-600">The score is out of 100. A score of 100 means no gaps were found based on the selected framework. Lower scores indicate more critical or major findings that require your attention. Aim to resolve all Critical risks to significantly boost your score.</p>
                </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Still need help?</h2>
            <p className="text-slate-600 mb-4">Our support team is available Monday through Friday to assist you.</p>
            <a href="mailto:support@complyguard.com" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent/90 focus:outline-none">
                Contact Support
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
