import * as React from 'react';

interface PaymentLoadingAnimationProps {
  message: string;
  step: number;
  totalSteps: number;
}

const PaymentLoadingAnimation: React.FC<PaymentLoadingAnimationProps> = ({
  message,
  step,
  totalSteps,
}) => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const progress = (step / totalSteps) * 100;

  return (
    <div className="text-center">
      {/* Main Loading Spinner */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-16 h-16 mx-auto transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            className="text-blue-600 transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Step Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-600">{step}</span>
        </div>
      </div>
      
      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Processing Payment{dots}
      </h3>
      
      <p className="text-gray-600 mb-4">{message}</p>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Step Indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {[...Array(totalSteps)].map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index < step
                ? 'bg-blue-600 scale-110'
                : index === step - 1
                ? 'bg-blue-400 animate-pulse'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      
      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-center">
          <span className="text-green-600 mr-2">🔒</span>
          <span className="text-sm text-green-800 font-medium">
            Secure 256-bit SSL Encryption
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Please don't close this window during payment processing
      </p>
    </div>
  );
};

export default PaymentLoadingAnimation;