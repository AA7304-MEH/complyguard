import * as React from 'react';

const RefundPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Refund and Cancellation Policy</h1>
      
      <div className="space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Subscription Cancellation</h2>
          <p>
            You can cancel your ComplyGuard AI subscription at any time through your dashboard settings. 
            Your access will remain active until the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Refund Eligibility</h2>
          <p>
            We offer a 7-day money-back guarantee for new subscriptions if you are not satisfied with our service. 
            To request a refund, please contact our support team within 7 days of your initial purchase.
          </p>
          <p className="mt-2">
            Refunds are not available for:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Renewal payments</li>
            <li>Accounts that have violated our Terms of Service</li>
            <li>Credits that have already been used for document scanning</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Processing Refunds</h2>
          <p>
            Approved refunds will be processed within 5-7 business days and will be credited back to your original payment method (Razorpay or PayPal).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Contact Us</h2>
          <p>
            If you have any questions about our Refund Policy, please contact us at support@complyguard.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
