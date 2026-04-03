import * as React from 'react';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { User, SubscriptionTier } from '../types';
import { getPlanByTier } from '../config/subscriptionPlans';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    user: User;
    onHome?: () => void;
    onUpgrade?: () => void;
    onManageSubscription?: () => void;
    onViewAnalytics?: () => void;
    onViewTemplates?: () => void;
    onViewCalendar?: () => void;
    onViewAPI?: () => void;
    onEnableAdmin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user,
  onHome, 
  onUpgrade, 
  onManageSubscription, 
  onViewAnalytics, 
  onViewTemplates, 
  onViewCalendar,
  onViewAPI,
  onEnableAdmin
}) => {
  const currentPlan = getPlanByTier(user.subscription_tier);
  const usagePercentage = user.scan_limit_this_month > 0 
    ? (user.documents_scanned_this_month / user.scan_limit_this_month) * 100 
    : 0;

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-slate-900">ComplyGuard AI</h1>
            
            {/* Navigation Menu - Production Sync */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={onHome}
                className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-slate-50 flex items-center"
              >
                Dashboard
              </button>
              <button
                onClick={onHome} // For now, Scans also shows the dashboard (all scans table)
                className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-slate-50"
              >
                Scans
              </button>
              <button
                onClick={onViewAnalytics}
                className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-slate-50"
              >
                Monitoring
              </button>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <button
                onClick={() => {
                    // Logic to open modal from anywhere - assuming we'll lift this to App level or standard event
                    window.dispatchEvent(new CustomEvent('open-new-scan'));
                }}
                className="bg-accent text-accent-foreground px-4 py-2 text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-accent/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                New Scan
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Subscription Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentPlan?.tier === SubscriptionTier.Free ? 'bg-gray-100 text-gray-800' :
                    currentPlan?.tier === SubscriptionTier.Basic ? 'bg-blue-100 text-blue-800' :
                    currentPlan?.tier === SubscriptionTier.Professional ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentPlan?.name || 'Free'}
                  </span>
                  {user.subscription_tier === SubscriptionTier.Free && (
                    <button
                      onClick={onUpgrade}
                      className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded hover:bg-accent/90 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {user.documents_scanned_this_month} / {user.scan_limit_this_month === -1 ? '∞' : user.scan_limit_this_month} scans
                  {usagePercentage >= 80 && user.scan_limit_this_month > 0 && (
                    <span className="text-yellow-600 ml-1">({Math.round(usagePercentage)}%)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <NotificationCenter user={user} />

            {/* User Info */}
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
              <p className="text-xs text-gray-500">{user.company_name}</p>
            </div>

            {/* User Menu */}
            <div className="relative">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Manage Subscription"
                    labelIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    }
                    onClick={onManageSubscription}
                  />
                  {user.subscription_tier === SubscriptionTier.Free && (
                    <UserButton.Action
                      label="Upgrade Plan"
                      labelIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      }
                      onClick={onUpgrade}
                    />
                  )}
                  {user.subscription_tier !== SubscriptionTier.Enterprise && (
                    <UserButton.Action
                      label="Enable Admin Mode (Unlock Everything)"
                      labelIcon={
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      }
                      onClick={onEnableAdmin}
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;