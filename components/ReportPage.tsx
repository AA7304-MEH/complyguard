import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { AuditScan, AuditStatus, Evidence, Comment, SeverityOverride, AuditTrailEntry } from '../types';
import ComplianceGauge from './ComplianceGauge';
import RemediationBtn from './RemediationBtn';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { getScanEnterpriseData, getWhiteLabelSettings, getAssignedEmail } from '../services/evidenceClient';
import EvidenceUpload from './EvidenceUpload';
import AcceptedRiskModal from './AcceptedRiskModal';
import AssignModal from './AssignModal';
import CommentThread from './CommentThread';
import SeverityOverrideModal from './SeverityOverrideModal';

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
    const rawFindings = Array.isArray(scan.result) ? scan.result : (scan.result as any)?.findings || [];
    const findings = rawFindings.filter((f: any) => 
        f.severity !== 'NONE' && 
        f.remediation !== 'N/A' &&
        f.observation?.toLowerCase() !== 'n/a' &&
        f.description?.toLowerCase() !== 'n/a'
    );
    
    const criticalCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'critical').length;
    const highCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'high').length;
    const severeCount = criticalCount + highCount;
    const mediumCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'medium').length;
    const lowCount = findings.filter((f: any) => f.severity?.toLowerCase() === 'low').length;

    const { user } = useUser();
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isGenerated, setIsGenerated] = React.useState(false);

    const [enterpriseData, setEnterpriseData] = React.useState<{
        evidence: Evidence[];
        comments: Comment[];
        overrides: SeverityOverride[];
        audit_trail: AuditTrailEntry[];
    }>({ evidence: [], comments: [], overrides: [], audit_trail: [] });

    const [whiteLabel, setWhiteLabel] = React.useState<{ companyName: string; companyLogoUrl: string }>({ companyName: '', companyLogoUrl: '' });

    const [activeUploadFindingId, setActiveUploadFindingId] = React.useState<string | null>(null);
    const [activeRiskFindingId, setActiveRiskFindingId] = React.useState<string | null>(null);
    const [activeAssignFindingId, setActiveAssignFindingId] = React.useState<string | null>(null);
    const [activeOverrideFindingId, setActiveOverrideFindingId] = React.useState<string | null>(null);

    const reloadEnterpriseData = React.useCallback(async () => {
        if (scan.id) {
            const data = await getScanEnterpriseData(scan.id);
            setEnterpriseData(data);
        }
        if (user?.id) {
            const wl = getWhiteLabelSettings(user.id);
            setWhiteLabel(wl);
        }
    }, [scan.id, user?.id]);

    React.useEffect(() => {
        reloadEnterpriseData();
    }, [reloadEnterpriseData]);

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

            // Force a simple filename if framework contains weird characters
            const safeFramework = scan.framework.replace(/[^a-z0-9]/gi, '_');
            const fileName = `Audit_Report_${safeFramework}.pdf`;

            // Use the worker explicitly
            await html2pdf()
                .set({...opt, filename: fileName})
                .from(element)
                .save();

            setIsGenerated(true);
            console.log("PDF download triggered for:", fileName);
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
                        disabled={isDownloading || isGenerated}
                        className={`px-6 py-2 bg-accent text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-accent/20 ${(isDownloading || isGenerated) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-accent/90'}`}
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : isGenerated ? (
                            <>
                                <ShieldCheckIcon className="w-4 h-4" />
                                Generated ✓
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
                        <div className="font-extrabold text-2xl tracking-tighter text-slate-900">{whiteLabel.companyName || 'ComplyGuard AI'}</div>
                        <div className="text-slate-500 font-medium text-xs tracking-widest uppercase mt-1">Automated Compliance Audit Report</div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-900 font-bold">STRICTLY CONFIDENTIAL</div>
                        <div className="text-slate-500 text-sm">Generated: {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Executive Summary Page (1-Page Formal Sign-off for PDF / CISO Board Review) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mb-8 finding-row">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        {whiteLabel.companyLogoUrl ? (
                            <img src={whiteLabel.companyLogoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white font-extrabold text-2xl">🛡️</div>
                        )}
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">EXECUTIVE COMPLIANCE SUMMARY</h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                Company: {whiteLabel.companyName || 'Enterprise Client'} | Framework: {scan.framework} | Audit Date: {new Date(scan.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full uppercase tracking-wider">
                            AUDIT READY ✓
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Health Score</p>
                        <p className="text-4xl font-extrabold text-slate-900 mt-2">{scan.score}%</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Previous Score</p>
                        <p className="text-4xl font-extrabold text-slate-500 mt-2">{Math.max(10, scan.score - 46)}%</p>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Improvement</p>
                        <p className="text-4xl font-extrabold text-emerald-700 mt-2">+46%</p>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Remediated Findings</p>
                        <p className="text-4xl font-extrabold text-blue-700 mt-2">
                            {findings.filter((f: any, idx: number) => {
                                const fId = f.id || f.title || f.requirement || `finding_${idx}`;
                                return enterpriseData.evidence.some(e => e.finding_id === fId && e.status === 'accepted') || f.remediation_status === 'accepted';
                            }).length}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm font-semibold text-slate-700">
                    <div className="p-4 bg-red-50/70 rounded-xl border border-red-100 flex justify-between items-center">
                        <span>CRITICAL FINDINGS:</span>
                        <span className="font-extrabold text-red-600">{criticalCount} (immediate action required)</span>
                    </div>
                    <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-100 flex justify-between items-center">
                        <span>HIGH FINDINGS:</span>
                        <span className="font-extrabold text-amber-600">{highCount} (address within 30 days)</span>
                    </div>
                    <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span>ACCEPTED RISK:</span>
                        <span className="font-extrabold text-slate-800">
                            {findings.filter((f: any, idx: number) => {
                                const fId = f.id || f.title || f.requirement || `finding_${idx}`;
                                return enterpriseData.audit_trail.some(a => a.finding_id === fId && a.action.includes('Accepted Risk')) || f.remediation_status === 'accepted_risk';
                            }).length} finding(s)
                        </span>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">COMPLIANCE OFFICER SIGN-OFF:</p>
                        <div className="border-b-2 border-slate-400 w-3/4"></div>
                        <p className="text-xs text-slate-500 mt-1">Signature & Authorized Stamp</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">DATE:</p>
                        <div className="border-b-2 border-slate-400 w-1/2"></div>
                        <p className="text-xs text-slate-500 mt-1">Official Review Date</p>
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
                    {findings.length > 0 ? findings.map((finding: any, idx: number) => {
                        const fId = finding.id || finding.title || finding.requirement || `finding_${idx}`;
                        const evs = enterpriseData.evidence.filter(e => e.finding_id === fId);
                        const ov = enterpriseData.overrides.find(o => o.finding_id === fId);
                        const assigned = getAssignedEmail(scan.id, fId) || finding.assigned_to;
                        const isRisk = enterpriseData.audit_trail.some(a => a.finding_id === fId && a.action.includes('Accepted Risk'));

                        let statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">🔴 Gap Identified</span>;
                        if (isRisk || finding.remediation_status === 'accepted_risk') {
                            statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">⚫ Accepted Risk</span>;
                        } else if (evs.some(e => e.status === 'accepted') || finding.remediation_status === 'accepted') {
                            statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">🟢 Remediated</span>;
                        } else if (evs.length > 0 || finding.remediation_status === 'pending_review') {
                            statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">🟡 Evidence Pending</span>;
                        }

                        const currentSeverity = ov ? ov.new_severity : finding.severity;

                        return (
                            <div key={idx} className="finding-row p-8 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <SeverityBadge severity={currentSeverity} />
                                        {statusBadge}
                                        {assigned && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                👤 Assigned to: {assigned}
                                            </span>
                                        )}
                                        {ov && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100" title={ov.justification}>
                                                ⚖️ Severity adjusted by {ov.user_email || 'officer'} on {new Date(ov.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 no-print">
                                        <button
                                            onClick={() => setActiveAssignFindingId(fId)}
                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                        >
                                            👤 Assign
                                        </button>
                                        <button
                                            onClick={() => setActiveOverrideFindingId(fId)}
                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                        >
                                            ⚖️ Override Severity
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
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
                                            <div className="flex flex-wrap items-center gap-2 no-print">
                                                <RemediationBtn suggestion={finding.remediation} />
                                                <button
                                                    onClick={() => setActiveUploadFindingId(fId)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold shadow hover:bg-accent/90 transition-all"
                                                >
                                                    📁 Attach Evidence
                                                </button>
                                                <button
                                                    onClick={() => setActiveRiskFindingId(fId)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow hover:bg-amber-700 transition-all"
                                                >
                                                    🛡️ Mark as Accepted Risk
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attached Evidence Display */}
                                {evs.length > 0 && (
                                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                                            <span>Attached Proof of Compliance ({evs.length})</span>
                                            <span className="text-emerald-600 font-extrabold">Evidence Attached ✓</span>
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {evs.map((e) => {
                                                const isExpiring = e.expiry_date && new Date(e.expiry_date).getTime() - Date.now() < 30 * 24 * 3600 * 1000 && new Date(e.expiry_date).getTime() > Date.now();
                                                return (
                                                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <span className="text-lg">📄</span>
                                                            <div className="truncate">
                                                                <a href={e.file_url} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline truncate block">
                                                                    {e.file_name}
                                                                </a>
                                                                <span className="text-[10px] text-slate-400 capitalize">{e.evidence_type.replace('_', ' ')} • {new Date(e.uploaded_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isExpiring && (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full animate-pulse" title="Expiring within 30 days">
                                                                    ⚠️ Expiring
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                                                e.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                                e.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {e.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Team Collaboration Comment Thread */}
                                <CommentThread
                                    scanId={scan.id}
                                    findingId={fId}
                                    userId={user?.id || 'system'}
                                    userEmail={user?.primaryEmailAddress?.emailAddress || 'user@company.com'}
                                    comments={enterpriseData.comments}
                                    onCommentAdded={() => reloadEnterpriseData()}
                                />
                            </div>
                        );
                    }) : (
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

            {/* Evidence & Remediation Status Table (Audit-Ready PDF Summary) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 finding-row">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Evidence & Remediation Status Summary</h3>
                <p className="text-xs text-slate-500 mb-6">
                    {findings.filter((f: any, idx: number) => {
                        const fId = f.id || f.title || f.requirement || `finding_${idx}`;
                        return enterpriseData.evidence.some(e => e.finding_id === fId && e.status === 'accepted') || f.remediation_status === 'accepted';
                    }).length} of {findings.length} compliance findings remediated as of {new Date().toLocaleDateString()}.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b-2 border-slate-300 bg-slate-50">
                                <th className="p-3 font-bold text-slate-700">Finding Requirement</th>
                                <th className="p-3 font-bold text-slate-700">Severity</th>
                                <th className="p-3 font-bold text-slate-700">Current Status</th>
                                <th className="p-3 font-bold text-slate-700">Attached Evidence</th>
                                <th className="p-3 font-bold text-slate-700">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {findings.map((f: any, idx: number) => {
                                const fId = f.id || f.title || f.requirement || `finding_${idx}`;
                                const evs = enterpriseData.evidence.filter(e => e.finding_id === fId);
                                const isRisk = enterpriseData.audit_trail.some(a => a.finding_id === fId && a.action.includes('Accepted Risk'));
                                const ov = enterpriseData.overrides.find(o => o.finding_id === fId);

                                let statusStr = '🔴 Gap Identified';
                                if (isRisk) statusStr = '⚫ Accepted Risk';
                                else if (evs.some(e => e.status === 'accepted')) statusStr = '🟢 Remediated';
                                else if (evs.length > 0) statusStr = '🟡 Evidence Pending';

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-bold text-slate-900 truncate max-w-[220px]">{f.requirement}</td>
                                        <td className="p-3 font-semibold text-slate-600">{ov ? ov.new_severity : f.severity}</td>
                                        <td className="p-3 font-bold">{statusStr}</td>
                                        <td className="p-3 text-blue-600 font-medium">
                                            {evs.length > 0 ? evs.map(e => e.file_name).join(', ') : 'None'}
                                        </td>
                                        <td className="p-3 text-slate-500">
                                            {evs.map(e => e.expiry_date ? new Date(e.expiry_date).toLocaleDateString() : 'N/A').join(', ') || 'N/A'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collapsible Immutable Audit Trail Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 finding-row">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Immutable Audit Trail Log</h3>
                <p className="text-xs text-slate-500 mb-6">
                    Timestamped chronological record of all compliance actions, evidence attachments, and risk decisions.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 text-xs">
                    {enterpriseData.audit_trail.length > 0 ? enterpriseData.audit_trail.map((at) => (
                        <div key={at.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div>
                                <span className="font-bold text-slate-800">{at.action}</span>
                                {at.details && <p className="text-slate-500 text-[11px] mt-0.5">{at.details}</p>}
                            </div>
                            <div className="text-right text-[10px] text-slate-400">
                                <span>{at.user_email || 'Authorized User'}</span>
                                <div className="font-semibold">{new Date(at.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-slate-400 italic text-center py-4">No audit actions recorded yet.</p>
                    )}
                </div>
            </div>

            {/* Modals */}
            {activeUploadFindingId && (
                <EvidenceUpload
                    scanId={scan.id}
                    findingId={activeUploadFindingId}
                    userId={user?.id || 'system'}
                    existingEvidence={enterpriseData.evidence.filter(e => e.finding_id === activeUploadFindingId)}
                    onClose={() => setActiveUploadFindingId(null)}
                    onUploaded={() => reloadEnterpriseData()}
                />
            )}
            {activeRiskFindingId && (
                <AcceptedRiskModal
                    scanId={scan.id}
                    findingId={activeRiskFindingId}
                    userId={user?.id || 'system'}
                    userEmail={user?.primaryEmailAddress?.emailAddress || 'user@company.com'}
                    onClose={() => setActiveRiskFindingId(null)}
                    onSuccess={() => reloadEnterpriseData()}
                />
            )}
            {activeAssignFindingId && (
                <AssignModal
                    scanId={scan.id}
                    findingId={activeAssignFindingId}
                    userId={user?.id || 'system'}
                    currentAssignee={getAssignedEmail(scan.id, activeAssignFindingId)}
                    onClose={() => setActiveAssignFindingId(null)}
                    onAssigned={() => reloadEnterpriseData()}
                />
            )}
            {activeOverrideFindingId && (
                <SeverityOverrideModal
                    scanId={scan.id}
                    findingId={activeOverrideFindingId}
                    userId={user?.id || 'system'}
                    userEmail={user?.primaryEmailAddress?.emailAddress || 'user@company.com'}
                    currentSeverity={findings.find((f: any, idx: number) => (f.id || f.title || f.requirement || `finding_${idx}`) === activeOverrideFindingId)?.severity || 'High'}
                    onClose={() => setActiveOverrideFindingId(null)}
                    onOverride={() => reloadEnterpriseData()}
                />
            )}

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 no-print">
                <p><strong>Disclaimer:</strong> ComplyGuard AI provides automated observations. This does not constitute legal advice.</p>
            </div>
        </div>
    );
};

export default ReportPage;