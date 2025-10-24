import * as React from 'react';
import { User, SubscriptionTier } from '../types';

interface PaymentAccessTestProps {
  user: User;
  onUpgrade: () => void;
}

const PaymentAccessTest: React.FC<PaymentAccessTestProps> = ({ user, onUpgrade }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg z-50">
      <div className="text-center">
        <h3 className="font-bold text-gray-900 mb-2">🧪 Payment Access Test</h3>
        <p className="text-sm text-gray-600 mb-3">
          Current Plan: <span className="font-semibold">{user.subscription_tier}</span>
        </p>
        
        {/* Test Buttons */}
        <div className="space-y-2">
          <button
            onClick={onUpgrade}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🚀 Test Payment Flow
          </button>
          
          <button
            onClick={() => {
              console.log('Payment buttons available:');
              console.log('1. Dashboard upgrade buttons');
              console.log('2. Header upgrade button');
              console.log('3. User menu upgrade option');
              console.log('4. Usage warning upgrade buttons');
              alert('Check console for payment button locations!');
            }}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            📍 Show Button Locations
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Click "Test Payment Flow" to access pricing
        </p>
      </div>
    </div>
  );
};

export default PaymentAccessTest;