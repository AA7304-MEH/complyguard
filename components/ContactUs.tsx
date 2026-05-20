import * as React from 'react';

const ContactUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <p className="text-slate-600">
            Have questions about ComplyGuard AI? Our team is here to help you automate your compliance journey.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900">Email</h3>
              <p className="text-accent">support@complyguard.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900">Business Hours</h3>
              <p className="text-slate-600">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Address</h3>
              <p className="text-slate-600">
                AI Innovation Hub, <br />
                Bangalore, Karnataka, India
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Send us a message</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none h-32" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full bg-accent text-white font-bold py-2 rounded-lg hover:bg-accent/90 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
