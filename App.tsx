import * as React from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { User, AuditScan, AuditStatus } from './types';
import { getAppUser, getScans } from './services/apiClient';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ReportPage from './components/ReportPage';
import Header from './components/Header';
import Spinner from './components/common/Spinner';

const MainApp: React.FC = () => {
  const [appUser, setAppUser] = React.useState<User | null>(null);
  const [scans, setScans] = React.useState<AuditScan[]>([]);
  const [selectedScan, setSelectedScan] = React.useState<AuditScan | null>(null);
  const [view, setView] = React.useState<'dashboard' | 'report'>('dashboard');
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
    setView('dashboard');
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
      <Header user={appUser} />
      <main className="p-4 sm:p-6 lg:p-8">
        {view === 'dashboard' && <Dashboard user={appUser} scans={scans} onUpdateScans={updateUserScans} onViewReport={viewReport} />}
        {view === 'report' && selectedScan && <ReportPage scan={selectedScan} onBack={backToDashboard} />}
      </main>
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