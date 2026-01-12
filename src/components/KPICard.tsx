import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number; // porcentaje, positivo/negativo
  icon?: React.ReactNode;
  invertTrend?: boolean;
}

export function KPICard({ title, value, trend, icon, invertTrend }: KPICardProps) {
  const isUp = (trend ?? 0) >= 0;
  const positive = invertTrend ? !isUp : isUp;
  const trendColor = positive ? 'text-emerald-600' : 'text-rose-600';
  const trendBg = positive ? 'bg-emerald-50' : 'bg-rose-50';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">{title}</div>
        {icon ? <div className="text-gray-400">{icon}</div> : null}
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {trend != null && (
        <div className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs ${trendBg} ${trendColor}`}>
          <span className="font-medium mr-1">{isUp ? '▲' : '▼'}</span>
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
