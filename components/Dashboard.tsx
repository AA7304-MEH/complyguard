import * as React from 'react';
import { AuditScan, AuditStatus, User } from '../types';
import NewScanModal from './NewScanModal';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface DashboardProps {
  user: User;
  scans: AuditScan[];
  onUpdateScans: (newScan: AuditScan) => void;
  onViewReport: (scan: AuditScan) => void;
  onUpgrade?: () => void;
}

const getStatusChip = (status: AuditStatus) => {
    switch (status) {
        case AuditStatus.Completed:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="w-4 h-4 mr-1.5" />Completed</span>;
        case AuditStatus.Processing:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse"><ClockIcon className="w-4 h-4 mr-1.5" />Processing</span>;
        case AuditStatus.Failed:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-4 h-4 mr-1.5" />Failed</span>;
    }
}

const Dashboard: React.FC<DashboardProps> = ({ user, scans, onUpdateScans, onViewReport, onUpgrade }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const scansRemaining = user.scan_limit_this_month === -1 ? Infinity : user.scan_limit_this_month - user.documents_scanned_this_month;
  const usagePercentage = user.scan_limit_this_month > 0 ? (user.documents_scanned_this_month / user.scan_limit_this_month) * 100 : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="mt-1 text-md text-gray-600">Welcome back, {user.company_name}.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={scansRemaining <= 0}
            className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-accent-foreground bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            New Compliance Scan
          </button>
        </div>

        {/* Usage Warning/Upgrade Prompts */}
        {user.subscription_tier === 'free' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">Unlock More Scans</h3>
                <p className="text-blue-700 mt-1">
                  You're on the Free plan with {user.scan_limit_this_month} scans per month. 
                  Upgrade to get more scans and advanced features.
                </p>
              </div>
              <button
                onClick={onUpgrade}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {scansRemaining <= 0 && user.scan_limit_this_month > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-red-900">Scan Limit Reached</h3>
                <p className="text-red-700 mt-1">
                  You've used all {user.scan_limit_this_month} scans for this month. 
                  Upgrade your plan to continue scanning documents.
                </p>
              </div>
              <button
                onClick={onUpgrade}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {usagePercentage >= 80 && usagePercentage < 100 && user.scan_limit_this_month > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-yellow-900">Approaching Scan Limit</h3>
                <p className="text-yellow-700 mt-1">
                  You've used {user.documents_scanned_this_month} of {user.scan_limit_this_month} scans ({Math.round(usagePercentage)}%). 
                  Consider upgrading to avoid interruptions.
                </p>
              </div>
              <button
                onClick={onUpgrade}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Monthly Usage</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.subscription_tier === 'free' ? 'bg-gray-100 text-gray-800' :
                user.subscription_tier === 'basic' ? 'bg-blue-100 text-blue-800' :
                user.subscription_tier === 'professional' ? 'bg-purple-100 text-purple-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
              </span>
            </div>
            
            {user.scan_limit_this_month > 0 ? (
              <>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          usagePercentage >= 90 ? 'bg-red-500' : 
                          usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{width: `${Math.min(usagePercentage, 100)}%`}}>
                    </div>
                </div>
                <p className="text-right text-sm text-gray-600 mt-1">
                  {user.documents_scanned_this_month} / {user.scan_limit_this_month} scans used
                </p>
              </>
            ) : (
              <p className="text-sm text-green-600 font-medium">Unlimited scans</p>
            )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-gray-900">Scan History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Findings</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scan.document_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.framework_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.created_at.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusChip(scan.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.status === 'completed' ? scan.findings_count : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {scan.status === 'completed' && (
                        <button onClick={() => onViewReport(scan)} className="text-accent hover:text-accent/90">View Report</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && <NewScanModal onClose={() => setIsModalOpen(false)} onScanStart={onUpdateScans} />}
    </>
  );
};

export default Dashboard;