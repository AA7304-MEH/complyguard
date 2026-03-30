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
    let colors = 'bg-slate-50 text-slate-700 border-slate-100'; // Default
    const lowerSeverity = severity.toLowerCase();
    
    if (lowerSeverity === 'critical') {
        colors = 'bg-red-600 text-white border-red-700 shadow-sm';
    } else if (lowerSeverity === 'high') {
        colors = 'bg-red-50 text-red-700 border-red-100'; 
    } else if (lowerSeverity === 'medium') {
        colors = 'bg-yellow-50 text-yellow-700 border-yellow-100';
    } else if (lowerSeverity === 'low') {
        colors = 'bg-blue-50 text-blue-700 border-blue-100';
    }

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest border ${colors}`}>
            {severity}
        </span>
    );
};

const ReportPage: React.FC<ReportPageProps> = ({ scan, onBack }) => {
    // findings from scan.result
    const findings = Array.isArray(scan.result) ? scan.result : (scan.result as any)?.findings || [];
    
    const criticalCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'critical').length;
    const highCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'high').length;
    const severeCount = criticalCount + highCount;
    const mediumCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'medium').length;
    const lowCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'low').length;

    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
        const element = document.getElementById('report-container');
        if (!element || isDownloading) return;

        setIsDownloading(true);
        try {
            const html2pdf = (window as any).html2pdf;
            if (!html2pdf) {
                alert("The PDF generator is still loading. Please try again in 2 seconds.");
                setIsDownloading(false);
                return;
            }

            const opt = {
                margin: [15, 15],
                filename: `ComplyGuard_Audit_${scan.framework}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true,
                    letterRendering: true,
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // Generate and save
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("Could not generate PDF. Please try again or use the browser's Print feature (Ctrl+P).");
        } finally {
            setIsDownloading(false);
        }
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
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    
                    /* Force visibility of the container and its parents */
                    html, body, #root, .min-h-screen, main, #report-container { 
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        display: block !important;
                        position: relative !important;
                    }

                    /* Hide everything outside of this component more reliably */
                    header, footer, nav, aside, .no-print { display: none !important; }
                    
                    /* Page Break Management */
                    .finding-row { 
                        page-break-inside: avoid !important; 
                        break-inside: avoid !important; 
                        display: block !important;
                        margin-bottom: 2rem !important;
                        position: relative !important;
                    }
                    h1, h2, h3 { page-break-after: avoid; }
                    
                    #report-container { 
                        width: 100% !important; 
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Clean up Shadows & Borders for Print */
                    .shadow-xl, .shadow-lg, .shadow-inner { box-shadow: none !important; }
                    .rounded-2xl { border: 1px solid #e2e8f0 !important; border-radius: 8px !important; }
                    .bg-slate-50\/50 { background-color: #f8fafc !important; }

                    /* Ensure finding details don't get clipped */
                    .overflow-hidden { overflow: visible !important; }
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
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`px-6 py-2 bg-accent text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-accent/20 ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-accent/90'}`}
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Audit PDF
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-500 font-medium rounded-lg hover:bg-slate-50 transition-all text-sm no-print"
                        title="Open Printer Dialog"
                    >
                        Print
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
                            <div className="text-xs text-red-500 uppercase font-bold mb-1">Critical/High</div>
                            <div className="text-xl font-bold text-red-700">{severeCount}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Med/Low</div>
                            <div className="text-xl font-bold text-slate-900">{mediumCount + lowCount}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-accent">
                            <div className="text-xs text-accent uppercase font-bold mb-1">Health</div>
                            <div className="text-xl font-bold text-accent">{scan.score}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Findings Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl">
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900 text-lg">Detailed Findings & Gaps</h2>
                </div>

                <div className="divide-y divide-slate-100">
                    {findings.length > 0 ? findings.map((finding: any, idx: number) => (
                        <div key={idx} className="finding-row p-8 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <SeverityBadge severity={finding.severity} />
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                            {finding.requirement}
                                        </h3>
                                    </div>
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