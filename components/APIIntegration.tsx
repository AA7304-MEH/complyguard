import * as React from 'react';
import { APIKey, User, SubscriptionTier } from '../types';

interface APIIntegrationProps {
  user: User;
  onUpgrade: () => void;
}

const APIIntegration: React.FC<APIIntegrationProps> = ({ user, onUpgrade }) => {
  const [apiKeys, setApiKeys] = React.useState<APIKey[]>([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>(['scans:read']);
  const [showKeyValue, setShowKeyValue] = React.useState<string | null>(null);

  const hasAPIAccess = user.subscription_tier !== SubscriptionTier.Free;

  // Mock API keys data
  React.useEffect(() => {
    if (hasAPIAccess) {
      const mockKeys: APIKey[] = [
        {
          id: '1',
          user_id: user.id,
          name: 'Production API Key',
          key: 'cg_live_1234567890abcdef',
          permissions: ['scans:read', 'scans:create', 'reports:read'],
          last_used: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          is_active: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: '2',
          user_id: user.id,
          name: 'Development API Key',
          key: 'cg_test_abcdef1234567890',
          permissions: ['scans:read'],
          is_active: true,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        }
      ];
      setApiKeys(mockKeys);
    }
  }, [user.id, hasAPIAccess]);

  const availablePermissions = [
    { id: 'scans:read', name: 'Read Scans', description: 'View scan results and history' },
    { id: 'scans:create', name: 'Create Scans', description: 'Initiate new compliance scans' },
    { id: 'reports:read', name: 'Read Reports', description: 'Access detailed compliance reports' },
    { id: 'templates:read', name: 'Read Templates', description: 'Access document templates' },
    { id: 'analytics:read', name: 'Read Analytics', description: 'View analytics and metrics' }
  ];

  const generateAPIKey = () => {
    const prefix = 'cg_live_';
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return prefix + randomString;
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    const newKey: APIKey = {
      id: Date.now().toString(),
      user_id: user.id,
      name: newKeyName,
      key: generateAPIKey(),
      permissions: selectedPermissions,
      is_active: true,
      created_at: new Date()
    };

    setApiKeys(prev => [...prev, newKey]);
    setShowKeyValue(newKey.id);
    setNewKeyName('');
    setSelectedPermissions(['scans:read']);
    setShowCreateModal(false);
  };

  const toggleKeyStatus = (keyId: string) => {
    setApiKeys(prev => prev.map(key =>
      key.id === keyId ? { ...key, is_active: !key.is_active } : key
    ));
  };

  const deleteKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, show a toast notification
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '...' + key.substring(key.length - 4);
  };

  if (!hasAPIAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">API Integration</h2>
            <p className="text-gray-600 mt-1">Integrate ComplyGuard with your applications</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-semibold text-primary mb-2">API Access Required</h3>
          <p className="text-gray-600 mb-6">
            API integration is available for Basic, Professional, and Enterprise plans.
            Upgrade your account to start building with our API.
          </p>
          <button
            onClick={onUpgrade}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Upgrade to Access API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">API Integration</h2>
          <p className="text-gray-600 mt-1">Manage your API keys and integrate with your applications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
        >
          Create API Key
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary">Your API Keys</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {apiKeys.map(apiKey => (
            <div key={apiKey.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                  <p className="text-sm text-gray-500">
                    Created {apiKey.created_at.toLocaleDateString()}
                    {apiKey.last_used && (
                      <span> • Last used {apiKey.last_used.toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    apiKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {apiKey.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleKeyStatus(apiKey.id)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {apiKey.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteKey(apiKey.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800">
                    {showKeyValue === apiKey.id ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowKeyValue(showKeyValue === apiKey.id ? null : apiKey.id)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {showKeyValue === apiKey.id ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="text-sm text-accent hover:text-accent/80"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Permissions</h5>
                <div className="flex flex-wrap gap-2">
                  {apiKey.permissions.map(permission => (
                    <span
                      key={permission}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {apiKeys.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600">Create your first API key to start integrating with ComplyGuard.</p>
            </div>
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Quick Start</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <code className="text-sm">
                curl -H "Authorization: Bearer YOUR_API_KEY" https://api.complyguard.ai/v1/scans
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Create a Scan</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <code className="text-sm">
                {`curl -X POST https://api.complyguard.ai/v1/scans \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"framework": "gdpr", "document_url": "https://example.com/policy.pdf"}'`}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Get Scan Results</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <code className="text-sm">
                curl -H "Authorization: Bearer YOUR_API_KEY" https://api.complyguard.ai/v1/scans/SCAN_ID
              </code>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Full API Documentation</h4>
              <p className="text-sm text-gray-600">Complete reference with examples and SDKs</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Docs
            </button>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Create API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name *</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="e.g., Production API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions(prev => [...prev, permission.id]);
                          } else {
                            setSelectedPermissions(prev => prev.filter(p => p !== permission.id));
                          }
                        }}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        <div className="text-xs text-gray-600">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || selectedPermissions.length === 0}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Key
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIIntegration;