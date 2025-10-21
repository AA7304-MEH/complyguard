import * as React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import PaymentLoadingAnimation from './PaymentLoadingAnimation';
import PaymentErrorRecovery from './PaymentErrorRecovery';
import { PaymentProvider } from '../types';

interface PaymentProgressProps {
  isVisible: boolean;
  currentStep: number;
  message: string;
  error?: string;
  paymentProvider?: PaymentProvider;
  onRetry?: () => void;
  onSwitchProvider?: (provider: PaymentProvider) => void;
  onCancel?: () => void;
}

const PaymentProgress: React.FC<PaymentProgressProps> = ({
  isVisible,
  currentStep,
  message,
  error,
  paymentProvider = PaymentProvider.Razorpay,
  onRetry,
  onSwitchProvider,
  onCancel,
}) => {
  const steps = [
    { id: 1, name: 'Initializing', description: 'Setting up secure payment' },
    { id: 2, name: 'Processing', description: 'Processing your payment' },
    { id: 3, name: 'Activating', description: 'Activating your subscription' },
    { id: 4, name: 'Complete', description: 'Payment successful!' },
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {error ? (
          // Error State with Enhanced Recovery
          <PaymentErrorRecovery
            error={error}
            currentProvider={paymentProvider}
            onSwitchProvider={onSwitchProvider || (() => {})}
            onRetry={onRetry || (() => {})}
            onContactSupport={() => {
              window.open('mailto:support@complyguard.ai?subject=Payment Error&body=' + encodeURIComponent(error));
            }}
            onCancel={onCancel || (() => {})}
          />
        ) : (
          // Enhanced Progress State
          <PaymentLoadingAnimation
            message={message}
            step={currentStep}
            totalSteps={4}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentProgress;