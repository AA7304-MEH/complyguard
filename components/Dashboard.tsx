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

const Dashboard: React.FC<DashboardProps> = ({ user, scans, onUpdateScans, onViewReport }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const scansRemaining = user.scan_limit_this_month - user.documents_scanned_this_month;

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

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-900">Monthly Usage</h3>
            <p className="text-sm text-gray-500">Your plan: <span className="font-semibold capitalize">{user.subscription_tier}</span></p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-accent h-2.5 rounded-full" 
                    style={{width: `${(user.documents_scanned_this_month / user.scan_limit_this_month) * 100}%`}}>
                </div>
            </div>
            <p className="text-right text-sm text-gray-600 mt-1">{user.documents_scanned_this_month} / {user.scan_limit_this_month} scans used</p>
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