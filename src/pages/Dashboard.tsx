import React, { useMemo, useState } from 'react';
import AnalyticsLineChart from '../components/Charts/ChartJS/AnalyticsLineChart';
import LinkedInLineChart from '../components/Charts/ChartJS/LinkedInLineChart';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function Dashboard() {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => addDays(endDate, -rangeDays), [endDate, rangeDays]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard (Chart.js)</h1>
        <div className="flex items-center gap-2">
          <label className="text-slate-600">Rango:</label>
          <select
            className="border rounded px-2 py-1 text-slate-700"
            value={rangeDays}
            onChange={e => setRangeDays(Number(e.target.value))}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>
      </div>

      <AnalyticsLineChart startDate={startDate} endDate={endDate} />
      <LinkedInLineChart startDate={startDate} endDate={endDate} />
    </div>
  );
}
