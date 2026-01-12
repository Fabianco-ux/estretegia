import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchMetricsData, RawMetricDoc } from '../../../services/fetchMetricsData';
import { generateDailyLabels } from '../../../utils/dateUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function toISODate(ts: any): string {
  // Soporta Date, número epoch, string ISO y Firestore Timestamp
  const d = ts instanceof Date
    ? ts
    : (typeof ts === 'number'
      ? new Date(ts)
      : (typeof ts === 'string'
        ? new Date(ts)
        : (ts && typeof ts.toDate === 'function'
          ? ts.toDate()
          : new Date(ts))));
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function groupDailyAnalytics(items: RawMetricDoc[]) {
  const byDay: Record<string, { users: number; sessions: number } > = {};
  for (const it of items) {
    const day = toISODate(it.timestamp ?? it.epochMs ?? Date.now());
    if (!byDay[day]) byDay[day] = { users: 0, sessions: 0 };
    byDay[day].users += Number(it.totalUsers ?? 0);
    byDay[day].sessions += Number(it.sessions ?? 0);
  }
  const entries = Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b));
  return {
    labels: entries.map(([date]) => date),
    users: entries.map(([,v]) => v.users),
    sessions: entries.map(([,v]) => v.sessions)
  };
}

export interface AnalyticsLineChartProps {
  startDate: Date;
  endDate: Date;
}

export const AnalyticsLineChart: React.FC<AnalyticsLineChartProps> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [usersData, setUsersData] = useState<number[]>([]);
  const [sessionsData, setSessionsData] = useState<number[]>([]);
  const [fetchedCount, setFetchedCount] = useState<number>(0);
  const [debugOpen, setDebugOpen] = useState<boolean>(false);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchMetricsData('analytics_metrics', startDate, endDate)
      .then(items => {
        if (!mounted) return;
        setFetchedCount(items.length);
        if (items.length > 0) {
          const grouped = groupDailyAnalytics(items);
          setLabels(grouped.labels);
          setUsersData(grouped.users);
          setSessionsData(grouped.sessions);
        } else {
          const lbls = generateDailyLabels(startDate, endDate);
          setLabels(lbls);
          setUsersData(Array(lbls.length).fill(0));
          setSessionsData(Array(lbls.length).fill(0));
        }
      })
      .catch(err => setError(err?.message ?? 'Error cargando datos'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [startDate, endDate]);

  const gradients = useMemo(() => {
    const ctx: CanvasRenderingContext2D | null = canvasRef.current?.ctx ?? null;
    if (!ctx) return { users: undefined as any, sessions: undefined as any };
    const height = canvasRef.current?.canvas?.height ?? 300;

    const usersGrad = ctx.createLinearGradient(0, 0, 0, height);
    usersGrad.addColorStop(0, 'rgba(34,197,94,0.35)');
    usersGrad.addColorStop(1, 'rgba(34,197,94,0.00)');

    const sesGrad = ctx.createLinearGradient(0, 0, 0, height);
    sesGrad.addColorStop(0, 'rgba(59,130,246,0.35)');
    sesGrad.addColorStop(1, 'rgba(59,130,246,0.00)');

    return { users: usersGrad, sessions: sesGrad };
  }, [canvasRef.current, labels.length]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Usuarios',
        data: usersData,
        borderColor: '#22c55e',
        backgroundColor: gradients.users ?? 'rgba(34,197,94,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: 'Sesiones',
        data: sessionsData,
        borderColor: '#3b82f6',
        backgroundColor: gradients.sessions ?? 'rgba(59,130,246,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      }
    ]
  }), [labels, usersData, sessionsData, gradients]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#334155' } },
      title: { display: true, text: 'Usuarios y Sesiones Diarias (Google Analytics)', color: '#0f172a' },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) => `${item.dataset.label}: ${item.formattedValue}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#475569' },
        grid: { color: 'rgba(148,163,184,0.2)' },
        title: { display: true, text: 'Fecha', color: '#334155' }
      },
      y: {
        ticks: { color: '#475569' },
        grid: { color: 'rgba(148,163,184,0.2)' },
        title: { display: true, text: 'Métrica', color: '#334155' }
      }
    }
  }), []);

  if (loading) return <div className="p-4 text-slate-500">Cargando…</div>;
  if (!labels.length) return (
    <div className="p-4 text-slate-500">
      No hay datos disponibles
      <div className="text-xs mt-1">Colección: analytics_metrics. Campos esperados: totalUsers, sessions y timestamp (Timestamp/epoch) o epochMs.</div>
    </div>
  );
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="w-full h-80 bg-white rounded-lg shadow p-4">
      <div className="text-xs text-slate-500 mb-2">
        Cargados {fetchedCount} documentos. Rango: {startDate.toISOString().slice(0,10)} a {endDate.toISOString().slice(0,10)}
        {/* Aviso de datos ficticios removido a petición */}
        {import.meta.env.DEV && (
          <button className="ml-2 px-2 py-0.5 border rounded text-slate-600" onClick={() => setDebugOpen(v => !v)}>
            {debugOpen ? 'Ocultar debug' : 'Mostrar debug'}
          </button>
        )}
      </div>
      {debugOpen && (
        <div className="mb-2 p-2 border rounded bg-slate-50 text-xs text-slate-700">
          <div><strong>Colección:</strong> analytics_metrics</div>
          <div><strong>Labels:</strong> {labels.slice(0,5).join(', ')}{labels.length > 5 ? '…' : ''}</div>
          <div><strong>Usuarios (primeros 5):</strong> {usersData.slice(0,5).join(', ')}{usersData.length > 5 ? '…' : ''}</div>
          <div><strong>Sesiones (primeros 5):</strong> {sessionsData.slice(0,5).join(', ')}{sessionsData.length > 5 ? '…' : ''}</div>
        </div>
      )}
      <Line ref={canvasRef} data={data} options={options} />
    </div>
  );
};

export default AnalyticsLineChart;
