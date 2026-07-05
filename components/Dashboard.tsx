import * as React from 'react';
import { AuditScan, AuditStatus, User } from '../types';
import NewScanModal from './NewScanModal';
import ComplianceGauge from './ComplianceGauge';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import RemediationProgress from './RemediationProgress';
import ComplianceTrendChart from './ComplianceTrendChart';
import ComplianceHeatmap from './ComplianceHeatmap';
import WhiteLabelSettings from './WhiteLabelSettings';

interface DashboardProps {
  user: User;
  scans: AuditScan[];
  onUpdateScans: (newScan: AuditScan) => void;
  onViewReport: (scan: AuditScan) => void;
  onUpgrade?: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
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

const Dashboard: React.FC<DashboardProps> = ({ 
    user, 
    scans, 
    onUpdateScans, 
    onViewReport, 
    onUpgrade,
    isModalOpen,
    setIsModalOpen
}) => {
  const [isGlobalDragging, setIsGlobalDragging] = React.useState(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[]>([]);

  // --- Global Drag and Drop Handlers ---
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide if we're actually leaving the window or hitting a target inside
    if (e.relatedTarget === null) {
      setIsGlobalDragging(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setDroppedFiles(files);
      setIsModalOpen(true);
    }
  };

  const closeScanModal = () => {
    setIsModalOpen(false);
    setDroppedFiles([]);
  };

  const scansRemaining = user.credits;
  const usagePercentage = user.subscription_tier === 'free' ? (user.free_credits_used ? 100 : 0) : (user.credits > 0 ? 20 : 100);
  
  // Calculate aggregate compliance score
  const completedScans = scans.filter(s => s.status === AuditStatus.Completed);
  const averageScore = completedScans.length > 0 
    ? Math.round(completedScans.reduce((acc, s) => acc + s.score, 0) / completedScans.length)
    : 0;

  return (
    <div 
        className="relative min-h-screen bg-slate-50/30 py-8 px-4 sm:px-6 lg:px-8"
        onDragOver={handleGlobalDragOver}
    >
      {/* Global Drag Overlay */}
      {isGlobalDragging && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/90 backdrop-blur-md transition-all duration-300"
            onDragLeave={handleGlobalDragLeave}
            onDrop={handleGlobalDrop}
        >
            <div className="text-center p-12 border-4 border-dashed border-white/40 rounded-3xl animate-in zoom-in-95 duration-200 max-w-md">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <svg className="w-10 h-10 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Drop Compliance Docs</h2>
                <p className="text-white/80 font-medium text-sm">Drop your files anywhere to instantly launch an AI audit.</p>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compliance Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Welcome back, <span className="font-semibold text-slate-800">{user.company_name}</span>. Here is your overview.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <span className={`text-xs font-bold px-3 py-2.5 rounded-xl border ${
              user.credits <= 0 
                ? 'bg-red-50 border-red-200 text-red-700 font-extrabold animate-pulse' 
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {user.documents_scanned_this_month} / {user.scan_limit_this_month === 999999 ? 'Unlimited' : user.scan_limit_this_month} Scans Used
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={user.credits <= 0}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-98 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200"
            >
              New Compliance Scan
            </button>
            {(user.subscription_tier === 'free' || user.credits <= 0) && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-98 transition-all duration-200"
              >
                💳 Upgrade Plan
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Aggregate Health */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center">
                <ComplianceGauge score={averageScore} />
                <p className="mt-4 text-xs text-center text-slate-400 font-semibold tracking-wider uppercase">Based on {completedScans.length} completed audits</p>
            </div>

            {/* Plan Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Tier</p>
                            <h3 className="text-xl font-bold text-slate-900">{user.subscription_tier.toUpperCase()} Plan</h3>
                        </div>
                        {user.credits <= 0 ? (
                            <span className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">Limit Reached</span>
                        ) : (
                            <span className="px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">Active</span>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500 font-medium">Scans Used</span>
                                <span className="font-bold text-blue-600">
                                    {user.documents_scanned_this_month} / {user.scan_limit_this_month === 999999 ? 'Unlimited' : user.scan_limit_this_month} scans
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                 <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r ${user.credits <= 0 ? 'from-red-500 to-orange-500' : 'from-blue-600 to-indigo-600'}`}
                                    style={{ width: `${Math.min((user.documents_scanned_this_month / user.scan_limit_this_month) * 100, 100)}%` }}
                                 ></div>
                            </div>
                            {user.credits <= 0 && (
                                <p className="text-xs font-bold text-red-500 mt-2">⚠️ Scan limit reached. Please upgrade your plan to run more scans.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 mt-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Next Sync</p>
                         <p className="text-sm font-bold text-slate-800">Apr 15, 2026</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Templates Used</p>
                         <p className="text-sm font-bold text-slate-800">12 templates</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Enterprise Platform Features */}
        <RemediationProgress scans={scans} onRescan={(scan) => { setIsModalOpen(true); }} />
        <ComplianceTrendChart scans={scans} />
        <ComplianceHeatmap scans={scans} />
        <WhiteLabelSettings userId={user.id} initialCompanyName={user.company_name} initialLogoUrl={user.company_logo_url} />

        {/* Scan History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Compliance Scans</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-bold">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Framework</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Health Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {scans.length > 0 ? (
                  scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-lg">🛡️</span> {scan.framework}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusChip(scan.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {scan.status === AuditStatus.Completed ? (
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${scan.score >= 80 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="font-extrabold text-slate-800">{scan.score}%</span>
                              </div>
                          ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        {scan.status === AuditStatus.Completed && (
                          <button 
                            onClick={() => onViewReport(scan)} 
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-all"
                          >
                            View Detailed Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="text-3xl">🗂️</p>
                        <p className="text-slate-800 font-bold">No scans performed yet</p>
                        <p className="text-xs text-slate-400">Start your first automated compliance audit by clicking "New Compliance Scan" above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <NewScanModal 
            onClose={closeScanModal} 
            onScanStart={onUpdateScans} 
            initialFiles={droppedFiles}
            onUpgrade={() => { closeScanModal(); onUpgrade?.(); }} 
        />
      )}
    </div>
  );
};

export default Dashboard;