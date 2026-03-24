import * as React from 'react';
import ScrollToTop from './ScrollToTop';

const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen text-slate-800">
      <ScrollToTop />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={onBack} className="text-accent hover:underline mb-8 font-medium">
          &larr; Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold mb-6 text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>
              When you use ComplyGuard AI, we collect information that you directly provide to us, including your account details (via Clerk authentication) and the documents you upload for compliance scanning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">2. How We Process Your Data</h2>
            <p>
              Documents uploaded for scanning are transmitted securely to our AI providers (Google Gemini) for the sole purpose of analyzing compliance gaps. 
              <strong> We do not use your private documents to train our AI models or third-party models.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">3. Data Retention and Deletion</h2>
            <p>
              We retain your scan reports and uploaded document metadata in our database to provide your scan history. 
              You can request the deletion of your account and all associated data at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">4. Security</h2>
            <p>
              We implement industry-standard security measures, including encryption in transit and at rest, to protect your data. 
              However, no internet-based service can be 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@complyguard.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
