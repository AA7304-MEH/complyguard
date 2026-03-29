import * as React from 'react';
import { AuditScan, AuditStatus, User } from '../types';
import NewScanModal from './NewScanModal';
import ComplianceGauge from './ComplianceGauge';
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
    case AuditStatus.Queued:
    case AuditStatus.Pending:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><ClockIcon className="w-4 h-4 mr-1.5" />Queued</span>;
    case AuditStatus.Failed:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-4 h-4 mr-1.5" />Failed</span>;
    default:
      return null;
  }
}

const Dashboard: React.FC<DashboardProps> = ({ user, scans, onUpdateScans, onViewReport, onUpgrade }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const scansRemaining = user.scan_limit_this_month === -1 ? Infinity : user.scan_limit_this_month - user.documents_scanned_this_month;
  const usagePercentage = user.scan_limit_this_month > 0 ? (user.documents_scanned_this_month / user.scan_limit_this_month) * 100 : 0;
  
  // Calculate aggregate compliance score
  const completedScans = scans.filter(s => s.status === AuditStatus.Completed);
  const averageScore = completedScans.length > 0 
    ? Math.round(completedScans.reduce((acc, s) => acc + s.score, 0) / completedScans.length)
    : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="mt-1 text-md text-gray-600">Welcome back, {user.company_name}.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={scansRemaining <= 0}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-accent-foreground bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              New Compliance Scan
            </button>
            {user.subscription_tier === 'free' && (
              <button
                onClick={onUpgrade}
                className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                💳 Upgrade Plan
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Aggregate Health */}
            <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <ComplianceGauge score={averageScore} />
                <p className="mt-4 text-xs text-center text-slate-400 italic">Based on {completedScans.length} completed audits</p>
            </div>

            {/* Plan Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Plan Status: {user.subscription_tier.toUpperCase()}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">ACTIVE</span>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Monthly Usage</span>
                            <span className="font-medium text-gray-900">{user.documents_scanned_this_month} / {user.scan_limit_this_month > 0 ? user.scan_limit_this_month : '∞'} scans</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                             <div 
                                className={`h-2 rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-accent'}`}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                             ></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Next Audit</p>
                             <p className="text-sm font-medium">Apr 15, 2026</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Templates Used</p>
                             <p className="text-sm font-medium">12</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Scan History */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Compliance Scans</h2>
            <button className="text-sm text-accent font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.length > 0 ? (
                  scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">🛡️ {scan.framework}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(scan.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusChip(scan.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {scan.status === AuditStatus.Completed ? (
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${scan.score >= 80 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="font-bold">{scan.score}%</span>
                              </div>
                          ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-accent">
                        {scan.status === AuditStatus.Completed && (
                          <button onClick={() => onViewReport(scan)} className="hover:underline">View Detailed Report</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No scans performed yet. Start your first audit today!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && <NewScanModal onClose={() => setIsModalOpen(false)} onScanStart={onUpdateScans} onUpgrade={() => { setIsModalOpen(false); onUpgrade?.(); }} />}
    </>
  );
};

export default Dashboard;