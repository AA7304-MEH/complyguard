import * as React from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { User, AuditScan, AuditStatus, SubscriptionPlan, BillingCycle } from './types';
import { getAppUser, getScans } from './services/apiClient';
import { getPlanByTier } from './config/subscriptionPlans';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ReportPage from './components/ReportPage';
import PricingPage from './components/PricingPage';
import SubscriptionManagement from './components/SubscriptionManagement';
import PaymentCheckout from './components/PaymentCheckout';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentTemplates from './components/DocumentTemplates';
import ComplianceCalendar from './components/ComplianceCalendar';
import APIIntegration from './components/APIIntegration';
import PaymentTesting from './components/PaymentTesting';
import PaymentTestSimple from './components/PaymentTestSimple';
import PaymentAccessTest from './components/PaymentAccessTest';
import Header from './components/Header';
import Spinner from './components/common/Spinner';
import SuccessNotification from './components/common/SuccessNotification';

const MainApp: React.FC = () => {
  const [appUser, setAppUser] = React.useState<User | null>(null);
  const [scans, setScans] = React.useState<AuditScan[]>([]);
  const [selectedScan, setSelectedScan] = React.useState<AuditScan | null>(null);
  const [view, setView] = React.useState<'dashboard' | 'report' | 'pricing' | 'subscription' | 'checkout' | 'analytics' | 'templates' | 'calendar' | 'api' | 'payment-test' | 'payment-simple'>('dashboard');
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<BillingCycle>(BillingCycle.Monthly);
  const [showSuccessNotification, setShowSuccessNotification] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState({ title: '', message: '' });
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const { isLoaded: isClerkLoaded, user: clerkUser } = useUser();

  React.useEffect(() => {
    if (isClerkLoaded) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          if (clerkUser) {
             // In a real app, you would pass clerkUser.id to get their specific data
            const [userData, scansData] = await Promise.all([
              getAppUser(clerkUser.id),
              getScans()
            ]);
            setAppUser(userData);
            setScans(scansData);
          }
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isClerkLoaded, clerkUser]);

  // Poll for scan updates if there are any scans in processing state
  React.useEffect(() => {
    const hasProcessingScans = scans.some(s => s.status === AuditStatus.Processing);
    
    if (!hasProcessingScans) {
      return;
    }

    const interval = setInterval(async () => {
      console.log("Polling for scan updates...");
      const updatedScans = await getScans();
      // Only update state if the data has actually changed to prevent infinite loops
      if (JSON.stringify(updatedScans) !== JSON.stringify(scans)) {
        setScans(updatedScans);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);

  }, [scans]);

  const updateUserScans = React.useCallback((newScan: AuditScan) => {
    setScans(prevScans => [newScan, ...prevScans]);
    setAppUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        documents_scanned_this_month: prevUser.documents_scanned_this_month + 1,
      };
    });
  }, []);

  const viewReport = React.useCallback((scan: AuditScan) => {
    setSelectedScan(scan);
    setView('report');
  }, []);
  
  const backToDashboard = React.useCallback(() => {
    setSelectedScan(null);
    setSelectedPlan(null);
    setView('dashboard');
  }, []);

  const handlePlanSelect = React.useCallback((plan: SubscriptionPlan, billingCycle: BillingCycle) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(billingCycle);
    setView('checkout');
  }, []);

  const handlePaymentSuccess = React.useCallback((paymentData: any) => {
    // Update user subscription status
    if (appUser && selectedPlan) {
      const updatedUser = {
        ...appUser,
        subscription_tier: selectedPlan.tier,
        subscription_status: 'active' as any,
        scan_limit_this_month: selectedPlan.scan_limit,
        payment_provider: paymentData.provider,
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + (selectedBillingCycle === BillingCycle.Yearly ? 365 : 30) * 24 * 60 * 60 * 1000),
      };
      setAppUser(updatedUser);
    }
    
    setSelectedPlan(null);
    setView('dashboard');
    
    // Show success notification
    setSuccessMessage({
      title: 'Payment Successful! 🎉',
      message: `Your ${selectedPlan?.name} plan is now active. Welcome to ComplyGuard AI!`
    });
    setShowSuccessNotification(true);
  }, [appUser, selectedPlan, selectedBillingCycle]);

  const handleUpgrade = React.useCallback(() => {
    setView('pricing');
  }, []);

  const handleManageSubscription = React.useCallback(() => {
    setView('subscription');
  }, []);

  const handleViewAnalytics = React.useCallback(() => {
    setView('analytics');
  }, []);

  const handleViewTemplates = React.useCallback(() => {
    setView('templates');
  }, []);

  const handleViewCalendar = React.useCallback(() => {
    setView('calendar');
  }, []);

  const handleViewAPI = React.useCallback(() => {
    setView('api');
  }, []);

  const handleViewPaymentTest = React.useCallback(() => {
    setView('payment-test');
  }, []);

  const handleViewPaymentSimple = React.useCallback(() => {
    setView('payment-simple');
  }, []);

  const updateUser = React.useCallback((updatedUser: User) => {
    setAppUser(updatedUser);
  }, []);

  if (isLoading || !appUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
          <p className="text-secondary-foreground mt-4">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground">
      <Header 
        user={appUser} 
        onUpgrade={handleUpgrade}
        onManageSubscription={handleManageSubscription}
        onViewAnalytics={handleViewAnalytics}
        onViewTemplates={handleViewTemplates}
        onViewCalendar={handleViewCalendar}
        onViewAPI={handleViewAPI}
        onViewPaymentTest={handleViewPaymentTest}
        onViewPaymentSimple={handleViewPaymentSimple}
      />
      <main className={view === 'pricing' ? '' : 'p-4 sm:p-6 lg:p-8'}>
        {view === 'dashboard' && (
          <Dashboard 
            user={appUser} 
            scans={scans} 
            onUpdateScans={updateUserScans} 
            onViewReport={viewReport}
            onUpgrade={handleUpgrade}
          />
        )}
        {view === 'report' && selectedScan && (
          <ReportPage scan={selectedScan} onBack={backToDashboard} />
        )}
        {view === 'pricing' && (
          <PricingPage 
            currentPlan={getPlanByTier(appUser.subscription_tier)}
            onPlanSelect={handlePlanSelect}
            userLocation="IN" // You could detect this from IP or user settings
          />
        )}
        {view === 'subscription' && (
          <SubscriptionManagement 
            user={appUser}
            onUpgrade={handleUpgrade}
            onUpdateUser={updateUser}
          />
        )}
        {view === 'analytics' && (
          <AnalyticsDashboard 
            user={appUser}
            scans={scans}
          />
        )}
        {view === 'templates' && (
          <DocumentTemplates 
            user={appUser}
            onUpgrade={handleUpgrade}
          />
        )}
        {view === 'calendar' && (
          <ComplianceCalendar 
            user={appUser}
          />
        )}
        {view === 'api' && (
          <APIIntegration 
            user={appUser}
            onUpgrade={handleUpgrade}
          />
        )}
        {view === 'payment-test' && (
          <PaymentTesting 
            user={appUser}
          />
        )}
        {view === 'payment-simple' && (
          <PaymentTestSimple />
        )}
      </main>
      
      {view === 'checkout' && selectedPlan && (
        <PaymentCheckout
          user={appUser}
          plan={selectedPlan}
          billingCycle={selectedBillingCycle}
          onSuccess={handlePaymentSuccess}
          onCancel={backToDashboard}
        />
      )}
      
      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          title={successMessage.title}
          message={successMessage.message}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
      
      {/* Payment Access Test - Shows all available payment buttons */}
      {process.env.NODE_ENV === 'development' && (
        <PaymentAccessTest 
          user={appUser} 
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <MainApp />
      </SignedIn>
    </>
  );
};

export default App;