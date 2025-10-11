import * as React from 'react';
import { User, SubscriptionPlan, BillingCycle, SubscriptionStatus } from '../types';
import { SUBSCRIPTION_PLANS, getPlanById } from '../config/subscriptionPlans';
import { PaymentService } from '../services/paymentService';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { ClockIcon } from './icons/ClockIcon';

interface SubscriptionManagementProps {
  user: User;
  onUpgrade: () => void;
  onUpdateUser: (user: User) => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  user,
  onUpgrade,
  onUpdateUser,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const currentPlan = getPlanById(user.subscription_tier);
  const usagePercentage = user.scan_limit_this_month > 0 
    ? (user.documents_scanned_this_month / user.scan_limit_this_month) * 100 
    : 0;

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active:
        return 'text-green-600 bg-green-100';
      case SubscriptionStatus.Trialing:
        return 'text-blue-600 bg-blue-100';
      case SubscriptionStatus.PastDue:
        return 'text-yellow-600 bg-yellow-100';
      case SubscriptionStatus.Cancelled:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active:
        return <CheckCircleIcon className="w-5 h-5" />;
      case SubscriptionStatus.Trialing:
        return <ClockIcon className="w-5 h-5" />;
      case SubscriptionStatus.PastDue:
      case SubscriptionStatus.Cancelled:
        return <AlertTriangleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, call your backend API
      await PaymentService.cancelSubscription(user.id);
      
      // Update user status
      const updatedUser = {
        ...user,
        subscription_status: SubscriptionStatus.Cancelled,
      };
      onUpdateUser(updatedUser);
      
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!currentPlan) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Plan information not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Current Subscription</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.subscription_status)}`}>
            {getStatusIcon(user.subscription_status)}
            <span className="ml-2 capitalize">{user.subscription_status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">{currentPlan.name} Plan</h3>
            <p className="text-muted-foreground mb-4">{currentPlan.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{user.subscription_status}</span>
              </div>
              {user.subscription_start_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">{formatDate(user.subscription_start_date)}</span>
                </div>
              )}
              {user.subscription_end_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing:</span>
                  <span className="font-medium">{formatDate(user.subscription_end_date)}</span>
                </div>
              )}
              {user.trial_end_date && user.subscription_status === SubscriptionStatus.Trialing && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends:</span>
                  <span className="font-medium text-blue-600">{formatDate(user.trial_end_date)}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-primary mb-4">Usage This Month</h4>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Document Scans</span>
                <span className="font-medium">
                  {user.documents_scanned_this_month} / {user.scan_limit_this_month === -1 ? '∞' : user.scan_limit_this_month}
                </span>
              </div>
              
              {user.scan_limit_this_month > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage >= 90 ? 'bg-red-500' : 
                      usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {usagePercentage >= 80 && user.scan_limit_this_month > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    You're approaching your monthly scan limit. Consider upgrading your plan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPlan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Manage Subscription</h3>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onUpgrade}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            {currentPlan.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
          </button>

          {user.subscription_status === SubscriptionStatus.Active && currentPlan.tier !== 'free' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          )}

          <button
            onClick={() => window.open('/billing-history', '_blank')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Billing History
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">Cancel Subscription</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;