import * as React from 'react';
import { User, AnalyticsData, AuditScan } from '../types';

interface AnalyticsDashboardProps {
  user: User;
  scans: AuditScan[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user, scans }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'week' | 'month' | 'quarter'>('month');
  
  // Calculate analytics data
  const analyticsData = React.useMemo(() => {
    const completedScans = scans.filter(scan => scan.status === 'completed');
    const totalFindings = completedScans.reduce((sum, scan) => sum + scan.findings_count, 0);
    
    const findingsBySeverity = completedScans.reduce((acc, scan) => {
      scan.findings.forEach(finding => {
        acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      });
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    const frameworksUsed = [...new Set(completedScans.map(scan => scan.framework_name))];
    
    // Calculate compliance score (higher is better)
    const complianceScore = completedScans.length > 0 
      ? Math.max(0, 100 - (totalFindings / completedScans.length) * 10)
      : 100;

    return {
      totalScans: completedScans.length,
      totalFindings,
      findingsBySeverity,
      frameworksUsed,
      complianceScore: Math.round(complianceScore),
      averageFindingsPerScan: completedScans.length > 0 ? Math.round(totalFindings / completedScans.length) : 0
    };
  }, [scans]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Analytics Dashboard</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
        >
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="quarter">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Compliance Score */}
        <div className={`p-6 rounded-lg border-2 ${getScoreBgColor(analyticsData.complianceScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(analyticsData.complianceScore)}`}>
                {analyticsData.complianceScore}%
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Scans */}
        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-3xl font-bold text-blue-600">{analyticsData.totalScans}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Findings */}
        <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Findings</p>
              <p className="text-3xl font-bold text-orange-600">{analyticsData.totalFindings}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Frameworks Used */}
        <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Frameworks</p>
              <p className="text-3xl font-bold text-purple-600">{analyticsData.frameworksUsed.length}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings by Severity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-primary mb-4">Findings by Severity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span className="text-sm font-medium">High Risk</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{analyticsData.findingsBySeverity.high}</span>
                <div className="w-20 h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-red-500 rounded"
                    style={{ 
                      width: `${analyticsData.totalFindings > 0 ? (analyticsData.findingsBySeverity.high / analyticsData.totalFindings) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Medium Risk</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{analyticsData.findingsBySeverity.medium}</span>
                <div className="w-20 h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-yellow-500 rounded"
                    style={{ 
                      width: `${analyticsData.totalFindings > 0 ? (analyticsData.findingsBySeverity.medium / analyticsData.totalFindings) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Low Risk</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">{analyticsData.findingsBySeverity.low}</span>
                <div className="w-20 h-2 bg-gray-200 rounded">
                  <div 
                    className="h-2 bg-green-500 rounded"
                    style={{ 
                      width: `${analyticsData.totalFindings > 0 ? (analyticsData.findingsBySeverity.low / analyticsData.totalFindings) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frameworks Usage */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-primary mb-4">Framework Usage</h3>
          <div className="space-y-3">
            {analyticsData.frameworksUsed.length > 0 ? (
              analyticsData.frameworksUsed.map((framework, index) => {
                const frameworkScans = scans.filter(scan => scan.framework_name === framework && scan.status === 'completed').length;
                const percentage = (frameworkScans / analyticsData.totalScans) * 100;
                
                return (
                  <div key={framework} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{framework}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{frameworkScans} scans</span>
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div 
                          className="h-2 bg-accent rounded"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No framework data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-primary mb-4">📊 Compliance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Performance Summary</h4>
            <p className="text-sm text-gray-600">
              Your compliance score of {analyticsData.complianceScore}% is{' '}
              {analyticsData.complianceScore >= 90 ? 'excellent' : 
               analyticsData.complianceScore >= 70 ? 'good' : 'needs improvement'}.
              {analyticsData.averageFindingsPerScan > 0 && (
                ` Average of ${analyticsData.averageFindingsPerScan} findings per scan.`
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
            <p className="text-sm text-gray-600">
              {analyticsData.findingsBySeverity.high > 0 
                ? `Focus on resolving ${analyticsData.findingsBySeverity.high} high-risk findings first.`
                : analyticsData.totalFindings > 0
                ? 'Great job! No high-risk findings detected.'
                : 'Keep up the regular compliance scanning routine.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;