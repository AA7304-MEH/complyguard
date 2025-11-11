import * as React from 'react';

const PayPalDiagnostics: React.FC = () => {
  const [sdkStatus, setSdkStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [logs, setLogs] = React.useState<string[]>([]);
  const [buttonRendered, setButtonRendered] = React.useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  React.useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        addLog('🔄 Starting PayPal SDK load...');
        
        // Check if already loaded
        if (typeof (window as any).paypal !== 'undefined') {
          addLog('✅ PayPal SDK already available');
          setSdkStatus('loaded');
          return;
        }

        // Get client ID from environment
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
        addLog(`📝 Using Client ID: ${clientId.substring(0, 20)}...`);

        // Remove any existing PayPal scripts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com"]');
        existingScripts.forEach(script => {
          addLog(`🗑️ Removing existing PayPal script`);
          script.remove();
        });

        // Create new script
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&disable-funding=credit,card`;
        script.async = true;
        script.setAttribute('data-sdk-integration-source', 'button-factory');

        addLog(`📥 Loading PayPal SDK from: ${script.src.substring(0, 80)}...`);

        script.onload = () => {
          if (typeof (window as any).paypal !== 'undefined') {
            addLog('✅ PayPal SDK loaded successfully!');
            setSdkStatus('loaded');
          } else {
            addLog('❌ PayPal SDK loaded but window.paypal is undefined');
            setSdkStatus('error');
            setErrorMessage('PayPal SDK loaded but not available');
          }
        };

        script.onerror = (error) => {
          addLog(`❌ PayPal SDK load error: ${error}`);
          setSdkStatus('error');
          setErrorMessage('Failed to load PayPal SDK');
        };

        document.head.appendChild(script);
        addLog('📤 Script tag added to document head');

      } catch (error) {
        addLog(`❌ Exception during SDK load: ${error}`);
        setSdkStatus('error');
        setErrorMessage(String(error));
      }
    };

    loadPayPalSDK();
  }, []);

  React.useEffect(() => {
    if (sdkStatus === 'loaded' && !buttonRendered) {
      renderPayPalButton();
    }
  }, [sdkStatus, buttonRendered]);

  const renderPayPalButton = () => {
    try {
      addLog('🎨 Rendering PayPal button...');
      
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        addLog('❌ Container not found');
        return;
      }

      const paypal = (window as any).paypal;
      if (!paypal || !paypal.Buttons) {
        addLog('❌ PayPal.Buttons not available');
        return;
      }

      addLog('✅ PayPal.Buttons available, creating button...');

      paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 50
        },
        createOrder: (data: any, actions: any) => {
          addLog('💰 Creating order for $10.00 USD');
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: '10.00'
              },
              description: 'Test Payment - ComplyGuard AI'
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          addLog('✅ Payment approved! Order ID: ' + data.orderID);
          const details = await actions.order.capture();
          addLog('✅ Payment captured! Transaction ID: ' + details.id);
          alert('Payment successful! Check the logs below.');
        },
        onError: (error: any) => {
          addLog('❌ Payment error: ' + JSON.stringify(error));
        },
        onCancel: () => {
          addLog('⚠️ Payment cancelled by user');
        }
      }).render('#paypal-button-container')
        .then(() => {
          addLog('✅ PayPal button rendered successfully!');
          setButtonRendered(true);
        })
        .catch((error: any) => {
          addLog('❌ Button render error: ' + error);
        });

    } catch (error) {
      addLog('❌ Exception during button render: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            PayPal Integration Diagnostics
          </h1>

          {/* Status Card */}
          <div className={`p-4 rounded-lg mb-6 ${
            sdkStatus === 'loaded' ? 'bg-green-50 border border-green-200' :
            sdkStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {sdkStatus === 'loaded' && <span className="text-2xl">✅</span>}
                {sdkStatus === 'error' && <span className="text-2xl">❌</span>}
                {sdkStatus === 'loading' && <span className="text-2xl">⏳</span>}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium">
                  {sdkStatus === 'loaded' && 'PayPal SDK Loaded Successfully'}
                  {sdkStatus === 'error' && 'PayPal SDK Load Failed'}
                  {sdkStatus === 'loading' && 'Loading PayPal SDK...'}
                </h3>
                {errorMessage && (
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                )}
              </div>
            </div>
          </div>

          {/* PayPal Button Container */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Payment Button</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
              <div id="paypal-button-container" className="max-w-md mx-auto">
                {sdkStatus === 'loading' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading PayPal...</p>
                  </div>
                )}
                {sdkStatus === 'error' && (
                  <div className="text-center py-8 text-red-600">
                    <p className="font-semibold">Failed to load PayPal</p>
                    <p className="text-sm mt-2">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This is a test button for $10.00 USD. Use PayPal sandbox credentials to test.
            </p>
          </div>

          {/* Environment Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div><strong>Client ID:</strong> {import.meta.env.VITE_PAYPAL_CLIENT_ID?.substring(0, 30)}...</div>
              <div><strong>Environment:</strong> {import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox'}</div>
              <div><strong>Window.paypal:</strong> {typeof (window as any).paypal !== 'undefined' ? '✅ Available' : '❌ Not Available'}</div>
              <div><strong>Button Rendered:</strong> {buttonRendered ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>

          {/* Logs */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Wait for the PayPal button to appear above</li>
              <li>Click the PayPal button to initiate a test payment</li>
              <li>Use PayPal sandbox test credentials to complete the payment</li>
              <li>Check the logs below for detailed information</li>
              <li>If the button doesn't appear, check the error message and logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalDiagnostics;
