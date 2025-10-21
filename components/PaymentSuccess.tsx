import * as React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface PaymentSuccessProps {
  isVisible: boolean;
  paymentData: any;
  onContinue: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  isVisible,
  paymentData,
  onContinue,
}) => {
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
      
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Success Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-green-200 rounded-full mx-auto animate-ping"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Payment Successful!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Welcome to ComplyGuard AI! Your subscription has been activated and you're ready to start.
        </p>
        
        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-mono text-xs">
                {paymentData?.paymentId?.substring(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">
                {paymentData?.provider === 'razorpay' ? 'Razorpay' : 'PayPal'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">
                {paymentData?.currency === 'INR' ? '₹' : '$'}{paymentData?.amount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">✅ Completed</span>
            </div>
          </div>
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 What's Next?</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Access your dashboard and start scanning documents</p>
            <p>• Explore AI-powered compliance features</p>
            <p>• Set up your compliance calendar</p>
            <p>• Invite team members to collaborate</p>
          </div>
        </div>
        
        <button
          onClick={onContinue}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
        >
          Continue to Dashboard
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          A confirmation email has been sent to your inbox
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;