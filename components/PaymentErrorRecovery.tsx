import * as React from 'react';
import { PaymentProvider } from '../types';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface PaymentErrorRecoveryProps {
  error: string;
  currentProvider: PaymentProvider;
  onSwitchProvider: (provider: PaymentProvider) => void;
  onRetry: () => void;
  onContactSupport: () => void;
  onCancel: () => void;
}

const PaymentErrorRecovery: React.FC<PaymentErrorRecoveryProps> = ({
  error,
  currentProvider,
  onSwitchProvider,
  onRetry,
  onContactSupport,
  onCancel,
}) => {
  const alternativeProvider = currentProvider === PaymentProvider.Razorpay 
    ? PaymentProvider.PayPal 
    : PaymentProvider.Razorpay;

  const getErrorSuggestions = () => {
    const suggestions = [];
    
    if (error.toLowerCase().includes('card')) {
      suggestions.push({
        icon: '💳',
        title: 'Try a Different Card',
        description: 'Use another credit/debit card or check card details',
        action: onRetry,
        actionText: 'Retry Payment'
      });
    }
    
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      suggestions.push({
        icon: '🌐',
        title: 'Check Internet Connection',
        description: 'Ensure stable internet connection and try again',
        action: onRetry,
        actionText: 'Try Again'
      });
    }
    
    suggestions.push({
      icon: currentProvider === PaymentProvider.Razorpay ? '🌍' : '🇮🇳',
      title: `Switch to ${alternativeProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'}`,
      description: `Try ${alternativeProvider === PaymentProvider.Razorpay ? 'Indian' : 'international'} payment method`,
      action: () => onSwitchProvider(alternativeProvider),
      actionText: `Use ${alternativeProvider === PaymentProvider.Razorpay ? 'Razorpay' : 'PayPal'}`
    });
    
    suggestions.push({
      icon: '💬',
      title: 'Contact Support',
      description: 'Get help from our payment specialists',
      action: onContactSupport,
      actionText: 'Get Help'
    });
    
    return suggestions;
  };

  const suggestions = getErrorSuggestions();

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start mb-4">
        <AlertTriangleIcon className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">Payment Failed</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium text-red-800 mb-3">💡 Try these solutions:</h4>
        
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <span className="text-2xl mr-3">{suggestion.icon}</span>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{suggestion.title}</h5>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>
              </div>
              <button
                onClick={suggestion.action}
                className="ml-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                {suggestion.actionText}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Alternative Options */}
      <div className="mt-6 pt-4 border-t border-red-200">
        <h4 className="font-medium text-red-800 mb-3">🔄 Other Options:</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            🔄 Retry Same Method
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            🔄 Refresh Page
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ❌ Cancel Payment
          </button>
        </div>
      </div>
      
      {/* Support Contact */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-blue-600 mr-2">📧</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Need immediate help?</p>
            <p>
              Email us at <span className="font-medium">support@complyguard.ai</span> with your error details.
              Include this error message for faster resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentErrorRecovery;