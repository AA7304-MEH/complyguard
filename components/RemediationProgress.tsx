import * as React from 'react';
import { AuditScan } from '../types';
import { getScanEnterpriseData, ScanEnterpriseData } from '../services/evidenceClient';

interface RemediationProgressProps {
  scans: AuditScan[];
  onRescan: (scan: AuditScan) => void;
}

const RemediationProgress: React.FC<RemediationProgressProps> = ({ scans, onRescan }) => {
  const [enterpriseDataMap, setEnterpriseDataMap] = React.useState<Record<string, ScanEnterpriseData>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const map: Record<string, ScanEnterpriseData> = {};
      for (const scan of scans) {
        if (scan.id) {
          map[scan.id] = await getScanEnterpriseData(scan.id);
        }
      }
      if (isMounted) {
        setEnterpriseDataMap(map);
        setLoading(false);
      }
    };
    if (scans.length > 0) {
      fetchAll();
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [scans]);

  if (scans.length === 0) return null;

  // Calculate totals across all scans
  let totalFindings = 0;
  let remediatedCount = 0;
  let pendingCount = 0;
  let acceptedRiskCount = 0;
  let gapsRemainingCount = 0;
  let expiringSoonCount = 0;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  scans.forEach(scan => {
    const rawFindings = Array.isArray(scan.result) ? scan.result : (scan.result as any)?.findings || [];
    const findings = rawFindings.filter((f: any) => 
      f.severity !== 'NONE' && 
      f.remediation !== 'N/A' &&
      f.observation?.toLowerCase() !== 'n/a' &&
      f.description?.toLowerCase() !== 'n/a'
    );

    totalFindings += findings.length;
    const entData = enterpriseDataMap[scan.id] || { evidence: [], comments: [], overrides: [], audit_trail: [] };

    // Check expiring evidence
    entData.evidence.forEach(ev => {
      if (ev.expiry_date) {
        const exp = new Date(ev.expiry_date);
        if (exp <= thirtyDaysFromNow && exp >= now) {
          expiringSoonCount++;
        }
      }
    });

    findings.forEach((f: any, idx: number) => {
      const fId = f.id || f.title || f.requirement || `finding_${idx}`;
      const evs = entData.evidence.filter(e => e.finding_id === fId);
      const isAcceptedRisk = entData.audit_trail.some(a => a.finding_id === fId && a.action.includes('Accepted Risk'));

      if (isAcceptedRisk || f.remediation_status === 'accepted_risk') {
        acceptedRiskCount++;
      } else if (evs.some(e => e.status === 'accepted') || f.remediation_status === 'accepted') {
        remediatedCount++;
      } else if (evs.length > 0 || f.remediation_status === 'pending_review') {
        pendingCount++;
      } else {
        gapsRemainingCount++;
      }
    });
  });

  const remediationRate = totalFindings > 0 ? Math.round((remediatedCount / totalFindings) * 100) : 0;

  // Calculate donut chart segments (SVG)
  const total = totalFindings || 1;
  const pRemediated = (remediatedCount / total) * 100;
  const pPending = (pendingCount / total) * 100;
  const pRisk = (acceptedRiskCount / total) * 100;
  const pGaps = (gapsRemainingCount / total) * 100;

  const latestScan = scans[0];
  const daysSinceAudit = latestScan && latestScan.created_at
    ? Math.floor((now.getTime() - new Date(latestScan.created_at).getTime()) / (1000 * 3600 * 24))
    : 0;

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            ENTERPRISE WORKFLOW
          </span>
          <h2 className="mt-2 text-xl font-bold text-foreground">Remediation Progress & Evidence Management</h2>
          <p className="text-sm text-muted-foreground">
            Track proof of compliance, certificate expirations, and audit readiness across your enterprise.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Days Since Audit</p>
            <p className="text-lg font-bold text-foreground">{daysSinceAudit} Days</p>
          </div>
          {latestScan && (
            <button
              onClick={() => onRescan(latestScan)}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent/90"
            >
              🔄 Re-scan to Verify Improvements
            </button>
          )}
        </div>
      </div>

      {/* Expiring Evidence Alert */}
      {expiringSoonCount > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold">Compliance Calendar Warning</p>
              <p className="text-xs">
                {expiringSoonCount} piece{expiringSoonCount > 1 ? 's' : ''} of evidence (certificates or reports) expiring within 30 days.
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white">
            Action Required
          </span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Overall Stats & Progress Bar */}
        <div className="flex flex-col justify-center space-y-4 rounded-xl border border-border bg-muted/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Overall Remediation Rate</span>
            <span className="text-2xl font-bold text-accent">{remediationRate}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${remediationRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{remediatedCount}</strong> of <strong className="text-foreground">{totalFindings}</strong> compliance findings fully remediated with verified evidence.
          </p>
        </div>

        {/* Donut Chart Breakdown */}
        <div className="flex items-center justify-around rounded-xl border border-border bg-muted/20 p-5">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-500"
                strokeDasharray={`${pRemediated}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-lg font-bold text-foreground">{remediatedCount}</span>
              <span className="block text-[10px] text-muted-foreground">Fixed</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Remediated:</span>
              <span className="font-bold text-foreground">{remediatedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Evidence Pending:</span>
              <span className="font-bold text-foreground">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <span className="text-muted-foreground">Accepted Risk:</span>
              <span className="font-bold text-foreground">{acceptedRiskCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Gaps Remaining:</span>
              <span className="font-bold text-foreground">{gapsRemainingCount}</span>
            </div>
          </div>
        </div>

        {/* Per-Scan Quick Progress List */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-5 overflow-y-auto max-h-48">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Scan Status</h4>
          {scans.slice(0, 3).map((scan) => {
            const fList = Array.isArray(scan.result) ? scan.result : (scan.result as any)?.findings || [];
            const validF = fList.filter((f: any) => f.severity !== 'NONE' && f.remediation !== 'N/A');
            const ent = enterpriseDataMap[scan.id] || { evidence: [] };
            const rem = validF.filter((f: any, idx: number) => {
              const fId = f.id || f.title || f.requirement || `finding_${idx}`;
              return ent.evidence.some(e => e.finding_id === fId && e.status === 'accepted') || f.remediation_status === 'accepted';
            }).length;
            const pct = validF.length > 0 ? Math.round((rem / validF.length) * 100) : 100;

            return (
              <div key={scan.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[180px]">{scan.framework} Audit</span>
                  <span className="text-muted-foreground">{rem}/{validF.length} ({pct}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RemediationProgress;
