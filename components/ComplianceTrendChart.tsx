import * as React from 'react';
import { AuditScan } from '../types';

interface ComplianceTrendChartProps {
  scans: AuditScan[];
}

const ComplianceTrendChart: React.FC<ComplianceTrendChartProps> = ({ scans }) => {
  if (scans.length < 2) return null;

  // Sort scans chronologically (oldest to newest) for trend chart
  const sortedScans = [...scans].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ).slice(-6); // last 6 scans

  const firstScan = sortedScans[0];
  const lastScan = sortedScans[sortedScans.length - 1];
  const scoreDiff = (lastScan.score || 0) - (firstScan.score || 0);

  // Calculate time span in months/weeks
  const timeSpanDays = Math.max(1, Math.floor((new Date(lastScan.created_at).getTime() - new Date(firstScan.created_at).getTime()) / (1000 * 3600 * 24)));
  const timeSpanText = timeSpanDays > 30 ? `${Math.round(timeSpanDays / 30)} months` : `${timeSpanDays} days`;

  // Simple SVG Line Chart points
  const width = 500;
  const height = 180;
  const padding = 30;

  const points = sortedScans.map((s, idx) => {
    const x = padding + (idx / (sortedScans.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((s.score || 0) / 100) * (height - 2 * padding);
    return { x, y, score: s.score || 0, label: s.framework, date: new Date(s.created_at).toLocaleDateString() };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
            BOARD-LEVEL REPORTING
          </span>
          <h3 className="mt-2 text-lg font-bold text-foreground">Compliance Health Score Trend</h3>
          <p className="text-sm text-muted-foreground">
            Historical audit trajectory across your last {sortedScans.length} compliance assessments.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Overall Trajectory</p>
          <p className={`text-base font-bold ${scoreDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`} Improvement
          </p>
        </div>
      </div>

      {/* Banner message */}
      <div className="mt-4 rounded-xl bg-accent/10 border border-accent/20 p-3 text-sm font-medium text-foreground flex items-center justify-between">
        <span>
          📈 Your <strong>{lastScan.framework}</strong> compliance score improved from <strong className="text-accent">{firstScan.score || 0}%</strong> to <strong className="text-emerald-500">{lastScan.score || 0}%</strong> over {timeSpanText}.
        </span>
        <span className="text-xs text-muted-foreground hidden md:inline">Audit Ready ✓</span>
      </div>

      {/* SVG Line Chart */}
      <div className="mt-6 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - padding - (val / 100) * (height - 2 * padding);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" className="text-border" strokeDasharray="3 3" />
                <text x={0} y={y + 4} className="text-[10px] fill-muted-foreground">{val}%</text>
              </g>
            );
          })}

          {/* Trend Line */}
          <polyline fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />

          {/* Points and labels */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="6" className="fill-background stroke-accent stroke-2 group-hover:fill-accent group-hover:scale-125 transition-all" />
              <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[11px] font-bold fill-foreground">{p.score}%</text>
              <text x={p.x} y={height - 5} textAnchor="middle" className="text-[10px] fill-muted-foreground truncate max-w-[60px]">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default ComplianceTrendChart;
