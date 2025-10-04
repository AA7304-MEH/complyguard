import * as React from 'react';
import { AuditScan, FindingSeverity, AuditFinding } from '../types';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface ReportPageProps {
  scan: AuditScan;
  onBack: () => void;
}

const severityStyles = {
    [FindingSeverity.High]: {
        bg: 'bg-red-50',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: 'text-red-500',
    },
    [FindingSeverity.Medium]: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: 'text-yellow-500',
    },
    [FindingSeverity.Low]: {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: 'text-blue-500',
    },
}

const FindingCard: React.FC<{ finding: AuditFinding }> = ({ finding }) => {
    const styles = severityStyles[finding.severity];
    return (
        <div className={`border-l-4 p-4 rounded-r-lg ${styles.bg} ${styles.border}`}>
            <div className="flex items-start">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                    <AlertTriangleIcon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                    <div className="flex items-baseline">
                        <span className={`text-sm font-semibold capitalize ${styles.text}`}>
                           {finding.severity} Risk
                        </span>
                        <p className="ml-2 text-sm text-gray-600"> - {finding.framework_rule.article}: {finding.framework_rule.title}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 space-y-4">
                        <p><strong className="font-semibold text-gray-800">Remediation Advice:</strong> {finding.remediation_advice}</p>
                        <div>
                            <p className="font-semibold text-gray-800">Relevant Document Excerpt (Paragraph {finding.paragraph_number}):</p>
                            <blockquote className="mt-1 pl-3 py-2 border-l-2 border-gray-300 bg-gray-50 text-gray-600 italic">
                                "{finding.excerpt_from_document}"
                            </blockquote>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ReportPage: React.FC<ReportPageProps> = ({ scan, onBack }) => {

    const findingsBySeverity = (severity: FindingSeverity) => scan.findings.filter(f => f.severity === severity);

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Report</h1>
          <p className="text-md text-gray-500 mt-1">{scan.document_name}</p>
        </div>
        <button onClick={onBack} className="text-sm font-medium text-accent hover:underline">
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Framework</p>
          <p className="text-xl font-bold text-gray-900">{scan.framework_name}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Scan Date</p>
          <p className="text-xl font-bold text-gray-900">{scan.created_at.toLocaleDateString()}</p>
        </div>
        <div className="bg-red-100 border border-red-200 p-4 rounded-lg">
          <p className="text-sm font-medium text-red-700">Total Findings</p>
          <p className="text-xl font-bold text-red-900">{scan.findings_count}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">Summary of Findings</h2>
          <div className="space-y-6">
              {[FindingSeverity.High, FindingSeverity.Medium, FindingSeverity.Low].map(severity => {
                  const findings = findingsBySeverity(severity);
                  if (findings.length === 0) return null;
                  return (
                      <div key={severity}>
                          <h3 className="text-xl font-semibold text-gray-800 capitalize mb-3">{severity} Risk Findings</h3>
                          <div className="space-y-4">
                              {findings.map(finding => <FindingCard key={finding.id} finding={finding} />)}
                          </div>
                      </div>
                  )
              })}
              {scan.findings_count === 0 && (
                <div className="text-center py-10 bg-green-50 rounded-lg">
                    <p className="text-lg font-medium text-green-800">No compliance gaps were found.</p>
                    <p className="text-gray-600">The document appears to meet the requirements of the selected framework based on this scan.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;