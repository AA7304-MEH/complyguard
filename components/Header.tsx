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
}

const Header: React.FC<HeaderProps> = ({ 
  user,
  onHome, 
  onUpgrade, 
  onManageSubscription, 
  onViewAnalytics, 
  onViewTemplates, 
  onViewCalendar,
  onViewAPI
}) => {
  const currentPlan = getPlanByTier(user.subscription_tier);
  const usagePercentage = user.scan_limit_this_month > 0 
    ? (user.documents_scanned_this_month / user.scan_limit_this_month) * 100 
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={onHome}>
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
                ComplyGuard <span className="text-blue-600 font-extrabold">AI</span>
              </h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={onHome}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-2 text-sm font-semibold transition-all rounded-lg flex items-center gap-1.5"
              >
                Dashboard
              </button>
              <button
                onClick={onHome}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-2 text-sm font-semibold transition-all rounded-lg"
              >
                Scans
              </button>
              <button
                onClick={onViewAnalytics}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-2 text-sm font-semibold transition-all rounded-lg"
              >
                Monitoring
              </button>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <button
                onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-new-scan'));
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold rounded-lg shadow-sm hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2 border border-blue-700/10"
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    currentPlan?.tier === SubscriptionTier.Free ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                    currentPlan?.tier === SubscriptionTier.Basic ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    currentPlan?.tier === SubscriptionTier.Professional ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                    'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {currentPlan?.name || 'Free'}
                  </span>
                  {user.subscription_tier === SubscriptionTier.Free && (
                    <button
                      onClick={onUpgrade}
                      className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-2.5 py-1 rounded-md shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                  {user.credits} Credits Available
                  {user.credits <= 1 && user.subscription_tier === SubscriptionTier.Free && (
                    <span className="text-red-500 ml-1 font-extrabold animate-pulse"> (Low)</span>
                  )}
                </div>
              </div>
            </div>
 
            {/* Notifications */}
            <NotificationCenter user={user} />
 
            {/* User Info */}
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.email}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.company_name}</p>
            </div>
 
            {/* User Menu */}
            <div className="relative">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 shadow-inner border border-slate-200 hover:scale-105 transition-all duration-200",
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Manage Subscription"
                    labelIcon={
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    }
                    onClick={onManageSubscription}
                  />
                  {user.subscription_tier === SubscriptionTier.Free && (
                    <UserButton.Action
                      label="Upgrade Plan"
                      labelIcon={
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      }
                      onClick={onUpgrade}
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