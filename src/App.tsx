import * as React from 'react';
import { SignedIn, SignedOut, useUser, ClerkLoading, ClerkLoaded } from '@clerk/clerk-react';
import { User, AuditScan, AuditStatus, SubscriptionPlan, SubscriptionTier, SubscriptionStatus, BillingCycle } from '../types';
import { getAppUser, getScans, enableAdminMode } from '../services/apiClient';
import { getPlanByTier } from '../config/subscriptionPlans';
import LandingPage from '../components/LandingPage';
import Dashboard from '../components/Dashboard';
import ReportPage from '../components/ReportPage';
import PricingPage from '../components/PricingPage';
import SubscriptionManagement from '../components/SubscriptionManagement';
import FunctionalPaymentFlow from '../components/FunctionalPaymentFlow';
import ScrollToTop from '../components/ScrollToTop';
import Header from '../components/Header';
import SuccessNotification from '../components/common/SuccessNotification';

console.log("📍 App.tsx: Module Evaluation Started");

const MainApp: React.FC = () => {
  console.log("📍 MainApp: Initializing");
  React.useEffect(() => {
    console.log("🚀 ComplyGuard AI v1.5.0 [PRODUCTION_STABLE] - Build: 2026-03-25T21:45:00Z");
  }, []);
  
  const [appUser, setAppUser] = React.useState<User | null>(null);
  const [scans, setScans] = React.useState<AuditScan[]>([]);
  const [selectedScan, setSelectedScan] = React.useState<AuditScan | null>(null);
  const [view, setView] = React.useState<'dashboard' | 'report' | 'pricing' | 'subscription' | 'checkout'>('dashboard');
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  const [showSuccessNotification, setShowSuccessNotification] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState({ title: '', message: '' });
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const { isLoaded: isClerkLoaded, user: clerkUser } = useUser();

  const fetchData = React.useCallback(async () => {
    if (clerkUser) {
      try {
        const [userData, scansData] = await Promise.all([
          getAppUser(clerkUser.id),
          getScans(clerkUser.id)
        ]);
        setAppUser(userData);
        setScans(scansData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [clerkUser]);

  React.useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      fetchData();
    }
  }, [isClerkLoaded, clerkUser, fetchData]);

  // Poll for scan updates if there are any scans in processing/pending state
  React.useEffect(() => {
    const hasUnfinishedScans = scans.some(s => 
      s.status === AuditStatus.Processing || s.status === AuditStatus.Pending || s.status === AuditStatus.Queued
    );

    if (!hasUnfinishedScans || !clerkUser) return;

    const interval = setInterval(async () => {
      console.log("Polling for scan updates...");
      const updatedScans = await getScans(clerkUser.id);
      setScans(updatedScans);
    }, 5000); 

    return () => clearInterval(interval);
  }, [scans, clerkUser]);

  const onScanStarted = React.useCallback((newScan: AuditScan) => {
    // Add the new scan to state immediately
    setScans(prev => [newScan, ...prev]);
    
    // If the scan completed instantly, auto-navigate to the report
    if (newScan.status === AuditStatus.Completed || newScan.status === 'completed') {
      setSelectedScan(newScan);
      setView('report');
    }
    
    // Also refresh from DB in background
    if (clerkUser) fetchData();
  }, [clerkUser, fetchData]);

  const viewReport = React.useCallback((scan: AuditScan) => {
    setSelectedScan(scan);
    setView('report');
  }, []);

  const backToDashboard = React.useCallback(() => {
    setSelectedScan(null);
    setSelectedPlan(null);
    setView('dashboard');
    fetchData(); // Refresh usage data
  }, [fetchData]);

  const handlePlanSelect = React.useCallback((plan: SubscriptionPlan, billingCycle: BillingCycle) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(billingCycle);
    setView('checkout');
  }, []);

  const handlePaymentSuccess = React.useCallback((paymentData: any) => {
    setSelectedPlan(null);
    setView('dashboard');
    setSuccessMessage({
        title: 'Payment Successful! 🎉',
        message: `Your ${selectedPlan?.name} plan is now active. Welcome to ComplyGuard AI!`
    });
    setShowSuccessNotification(true);
    fetchData();
  }, [selectedPlan, fetchData]);

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 font-medium">Loading Production Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      <ScrollToTop />
      <Header
        user={appUser}
        onHome={backToDashboard}
        onUpgrade={() => setView('pricing')}
        onManageSubscription={() => setView('subscription')}
        onViewAnalytics={() => {}}
        onViewTemplates={() => {}}
        onViewCalendar={() => {}}
        onViewAPI={() => {}}
        onEnableAdmin={async () => {
            const up = await enableAdminMode(appUser.id);
            setAppUser(up);
            setSuccessMessage({ title: 'Admin Mode Active', message: 'Enterprise access granted.' });
            setShowSuccessNotification(true);
        }}
      />
      <main className="container mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard
            user={appUser}
            scans={scans}
            onUpdateScans={onScanStarted}
            onViewReport={viewReport}
            onUpgrade={() => setView('pricing')}
          />
        )}
        {view === 'report' && selectedScan && (
          <ReportPage scan={selectedScan} onBack={backToDashboard} />
        )}
        {view === 'pricing' && (
          <PricingPage
            currentPlan={getPlanByTier(appUser.subscription_tier)}
            onPlanSelect={handlePlanSelect}
            userLocation="US"
          />
        )}
        {view === 'subscription' && (
          <SubscriptionManagement
            user={appUser}
            onUpgrade={() => setView('pricing')}
            onUpdateUser={setAppUser}
          />
        )}
      </main>

      {view === 'checkout' && selectedPlan && (
        <FunctionalPaymentFlow
          user={appUser}
          plan={selectedPlan}
          billingCycle={selectedBillingCycle}
          onSuccess={handlePaymentSuccess}
          onCancel={backToDashboard}
        />
      )}

      {showSuccessNotification && (
        <SuccessNotification
          title={successMessage.title}
          message={successMessage.message}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  console.log("📍 App: Initializing");
  
  // Custom timeout to bypass Clerk if it hangs
  const [clerkTimeout, setClerkTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.warn("📍 App: Clerk initialization timed out. Falling back to mock view.");
      setClerkTimeout(true);
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ClerkLoading>
        {clerkTimeout ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
             <div>
                <h2 className="text-xl font-bold mb-2">Authentication Unavailable</h2>
                <p>Clerk failed to load. The application is running in local-only demo mode.</p>
                <div className="mt-4"><LandingPage /></div>
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 mt-4 font-medium">Initializing Authentication...</p>
            </div>
          </div>
        )}
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <LandingPage />
        </SignedOut>
        <SignedIn>
          <MainApp />
        </SignedIn>
      </ClerkLoaded>
    </>
  );
};

export default App;