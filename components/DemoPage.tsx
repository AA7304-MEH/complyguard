import React, { useState } from 'react';
import { Framework } from '../types';
import ComplianceGauge from './ComplianceGauge';
import RemediationBtn from './RemediationBtn';

interface DemoPageProps {
    onGetFullAccess: () => void;
}

const DemoPage: React.FC<DemoPageProps> = ({ onGetFullAccess }) => {
    const [pastedText, setPastedText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [demoResult, setDemoResult] = useState<any>(null);

    const handleDemoScan = async () => {
        if (!pastedText.trim()) return;
        setIsScanning(true);
        
        try {
            // Demo uses a simplified/mocked scan to show the UI
            // In production, this could call a restricted /api/demo-scan endpoint
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pastedText: pastedText.substring(0, 1000), // Limit demo input
                    framework: 'GDPR (Demo Preview Mode)',
                    isDemo: true 
                })
            });
            
            const data = await response.json();
            setDemoResult({
                score: 68,
                findings: [
                    {
                        requirement: "Opt-out Mechanism",
                        description: "The document lacks a clear 'one-click' opt-out mechanism for marketing communications.",
                        severity: "High",
                        remediation: "Add a clear instruction: 'You can opt-out at any time by clicking the Unsubscribe link in any email or visiting your settings page.'"
                    },
                    {
                        requirement: "Data Retention Period",
                        description: "The term 'as long as necessary' is too vague under Art. 5(1)(e).",
                        severity: "Medium",
                        remediation: "Specify a concrete period, e.g., 'We retain your data for 7 years following account closure for legal records.'"
                    }
                ]
            });
        } catch (error) {
            console.error("Demo scan failed", error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-600">
                    Try ComplyGuard AI Demo
                </h1>
                <p className="text-lg text-slate-600">
                    Paste a snippet of your Privacy Policy or Terms to see our AI Auditor in action.
                </p>
            </div>

            {!demoResult ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
                    <textarea 
                        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none resize-none mb-6"
                        placeholder="Paste your legal text here... (e.g. 'We collect your email and store it forever...')"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                    ></textarea>
                    
                    <button 
                        onClick={handleDemoScan}
                        disabled={isScanning || !pastedText.trim()}
                        className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" fill="none" />
                                </svg>
                                Run Instant Audit
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                        No registration required for demo. Limit: 1000 characters.
                    </p>
                </div>
            ) : (
                <div className="space-y-8 animate-in zoom-in duration-500">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-8">
                        <ComplianceGauge score={demoResult.score} size={160} />
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Audit Summary</h2>
                            <p className="text-slate-600 mb-6">
                                Our AI identified <span className="text-red-600 font-bold">{demoResult.findings.length} Compliance Gaps</span> in your provided snippet.
                            </p>
                            <button 
                                onClick={onGetFullAccess}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
                            >
                                Unlock Full Audit & PDF Export
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-bold text-slate-900 text-lg">Sample Findings</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {demoResult.findings.map((f: any, i: number) => (
                                <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900">{f.requirement}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${f.severity === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                            {f.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">{f.description}</p>
                                    <RemediationBtn suggestion={f.remediation} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="mt-16 text-center">
                <p className="text-slate-500 mb-4">Ready to automate your compliance workflow?</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                        🛡️ GDPR Ready
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                        ⚖️ SOC2 Checklists
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                        🏢 Enterprise PDF Reports
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoPage;
