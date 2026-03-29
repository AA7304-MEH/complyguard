import React from 'react';

interface ComplianceGaugeProps {
    score: number; // 0-100
    size?: number;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({ score, size = 160 }) => {
    const radius = size * 0.4;
    const stroke = size * 0.1;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return '#10B981'; // Green
        if (s >= 50) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    };

    return (
        <div className="flex flex-col items-center">
            <svg height={size} width={size}>
                <circle
                    stroke="#E5E7EB"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={getColor(score)}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <text
                    x="50%"
                    y="50%"
                    dy=".3em"
                    textAnchor="middle"
                    className="text-2xl font-bold font-sans"
                    fill={getColor(score)}
                >
                    {score}%
                </text>
            </svg>
            <p className="mt-2 text-sm text-slate-500 font-medium">Compliance Health</p>
        </div>
    );
};

export default ComplianceGauge;
