import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

console.log("📍 main.tsx: Executing full app mount");

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (window as any).CLERK_PUBLISHABLE_KEY;

const requiredEnvVars = [
  { key: 'VITE_CLERK_PUBLISHABLE_KEY', value: PUBLISHABLE_KEY },
  { key: 'VITE_RAZORPAY_KEY_ID', value: import.meta.env.VITE_RAZORPAY_KEY_ID },
  { key: 'VITE_PAYPAL_CLIENT_ID', value: import.meta.env.VITE_PAYPAL_CLIENT_ID }
];

const missingVars = requiredEnvVars.filter(env => !env.value);

if (missingVars.length > 0) {
  missingVars.forEach(env => {
    console.error(`Missing env var: ${env.key}`);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if (missingVars.length > 0) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div style={{ padding: '20px', backgroundColor: '#fef2f2', color: '#dc2626', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Configuration Error</h2>
        <p>Configuration error: Missing API keys. Please contact support.</p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '16px' }}>Check console for details.</p>
      </div>
    </div>
  );
} else {

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', color: '#dc2626', minHeight: '100vh' }}>
          <h2>React Error Boundary Caught an Error!</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '10px' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
}
