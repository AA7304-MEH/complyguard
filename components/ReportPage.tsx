import React from 'react';
import { AuditScan, AuditStatus } from '../types';
import ComplianceGauge from './ComplianceGauge';
import RemediationBtn from './RemediationBtn';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface ReportPageProps {
    scan: AuditScan;
    onBack: () => void;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
    const colors = severity.toLowerCase() === 'high' 
        ? 'bg-red-50 text-red-700 border-red-100' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest border ${colors}`}>
            {severity}
        </span>
    );
};

const ReportPage: React.FC<ReportPageProps> = ({ scan, onBack }) => {
    // findings from scan.result
    const findings = Array.isArray(scan.result) ? scan.result : (scan.result as any)?.findings || [];
    const highSeverityCount = findings.filter((f: any) => f.severity.toLowerCase() === 'high').length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div id="report-container" className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 print:m-0 print:p-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 15mm; size: auto; }
                    body { 
                        background: white !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    
                    /* Clean up Shadows & Borders for Print */
                    .shadow-xl, .shadow-lg, .shadow-inner { box-shadow: none !important; }
                    
                    /* Page Break Management */
                    .finding-row { page-break-inside: avoid; break-inside: avoid; }
                    h1, h2, h3 { page-break-after: avoid; }
                    
                    /* Hide everything outside of this component */
                    body * { visibility: hidden; }
                    #report-container, #report-container * { visibility: visible; }
                    #report-container { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Print Only Professional Header */}
            <div className="hidden print-only mb-8 border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="font-extrabold text-2xl tracking-tighter text-slate-900">ComplyGuard AI</div>
                        <div className="text-slate-500 font-medium text-xs tracking-widest uppercase mt-1">Automated Compliance Audit Report</div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-900 font-bold">STRICTLY CONFIDENTIAL</div>
                        <div className="text-slate-500 text-sm">Generated: {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Header Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <ComplianceGauge score={scan.score} size={180} />
                
                <div className="flex-1 text-center md:text-left z-10">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                            {scan.framework}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${
                            scan.status === AuditStatus.Completed ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                            {scan.status}
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{scan.document_name}</h1>
                    <p className="text-slate-500 mb-6 font-medium">
                        Audit Date: {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Findings</div>
                            <div className="text-xl font-bold text-slate-900">{findings.length}</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                            <div className="text-xs text-red-500 uppercase font-bold mb-1">Critical</div>
                            <div className="text-xl font-bold text-red-700">{highSeverityCount}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Medium</div>
                            <div className="text-xl font-bold text-slate-900">{findings.length - highSeverityCount}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-accent">
                            <div className="text-xs text-accent uppercase font-bold mb-1">Health</div>
                            <div className="text-xl font-bold text-accent">{scan.score}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Findings Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900 text-lg">Detailed Findings & Gaps</h2>
                </div>

                <div className="divide-y divide-slate-100">
                    {findings.length > 0 ? findings.map((finding: any, idx: number) => (
                        <div key={idx} className="finding-row p-8 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <SeverityBadge severity={finding.severity} />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {finding.requirement}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {finding.requirement}
                                    </h3>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mt-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observations</h4>
                                    <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {finding.description}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Remediation Guide</h4>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-inner">
                                        <p className="text-slate-700 text-sm mb-4 leading-relaxed font-medium">
                                            {finding.remediation}
                                        </p>
                                        <div className="no-print">
                                            <RemediationBtn suggestion={finding.remediation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheckIcon className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Perfect Compliance!</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">No gaps were found in your document.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 no-print">
                <p><strong>Disclaimer:</strong> ComplyGuard AI provides automated observations. This does not constitute legal advice.</p>
            </div>
        </div>
    );
};

export default ReportPage;