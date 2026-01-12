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

function groupDailyLinkedIn(items: RawMetricDoc[]) {
  const byDay: Record<string, { impressions: number; clicks: number } > = {};
  for (const it of items) {
    const day = toISODate(it.timestamp ?? it.epochMs ?? Date.now());
    if (!byDay[day]) byDay[day] = { impressions: 0, clicks: 0 };
    byDay[day].impressions += Number(it.impressions ?? 0);
    byDay[day].clicks += Number(it.clicks ?? 0);
  }
  const entries = Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b));
  return {
    labels: entries.map(([date]) => date),
    impressions: entries.map(([,v]) => v.impressions),
    clicks: entries.map(([,v]) => v.clicks)
  };
}

export interface LinkedInLineChartProps {
  startDate: Date;
  endDate: Date;
}

export const LinkedInLineChart: React.FC<LinkedInLineChartProps> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [impData, setImpData] = useState<number[]>([]);
  const [clicksData, setClicksData] = useState<number[]>([]);
  const [rateData, setRateData] = useState<number[]>([]);
  const [fetchedCount, setFetchedCount] = useState<number>(0);
  const [debugOpen, setDebugOpen] = useState<boolean>(false);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchMetricsData('linkedin_metrics', startDate, endDate)
      .then(items => {
        if (!mounted) return;
        setFetchedCount(items.length);
        if (items.length > 0) {
          const grouped = groupDailyLinkedIn(items);
          setLabels(grouped.labels);
          setImpData(grouped.impressions);
          setClicksData(grouped.clicks);
          const rate = grouped.impressions.map((imp, i) => imp > 0 ? (grouped.clicks[i] / imp) : 0);
          setRateData(rate);
        } else {
          const lbls = generateDailyLabels(startDate, endDate);
          setLabels(lbls);
          const zeros = Array(lbls.length).fill(0);
          setImpData(zeros);
          setClicksData(zeros);
          setRateData(zeros);
        }
      })
      .catch(err => setError(err?.message ?? 'Error cargando datos'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [startDate, endDate]);

  const gradients = useMemo(() => {
    const ctx: CanvasRenderingContext2D | null = canvasRef.current?.ctx ?? null;
    if (!ctx) return { imp: undefined as any, clicks: undefined as any, rate: undefined as any };
    const height = canvasRef.current?.canvas?.height ?? 300;

    const impGrad = ctx.createLinearGradient(0, 0, 0, height);
    impGrad.addColorStop(0, 'rgba(99,102,241,0.35)');
    impGrad.addColorStop(1, 'rgba(99,102,241,0.00)');

    const clicksGrad = ctx.createLinearGradient(0, 0, 0, height);
    clicksGrad.addColorStop(0, 'rgba(234,88,12,0.35)');
    clicksGrad.addColorStop(1, 'rgba(234,88,12,0.00)');

    const rateGrad = ctx.createLinearGradient(0, 0, 0, height);
    rateGrad.addColorStop(0, 'rgba(16,185,129,0.35)');
    rateGrad.addColorStop(1, 'rgba(16,185,129,0.00)');

    return { imp: impGrad, clicks: clicksGrad, rate: rateGrad };
  }, [canvasRef.current, labels.length]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Impresiones',
        data: impData,
        borderColor: '#6366f1',
        backgroundColor: gradients.imp ?? 'rgba(99,102,241,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'y'
      },
      {
        label: 'Clics',
        data: clicksData,
        borderColor: '#ea580c',
        backgroundColor: gradients.clicks ?? 'rgba(234,88,12,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'y'
      },
      {
        label: 'Tasa de Interacción',
        data: rateData.map(v => Math.round(v * 1000) / 1000),
        borderColor: '#10b981',
        backgroundColor: gradients.rate ?? 'rgba(16,185,129,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'y1'
      }
    ]
  }), [labels, impData, clicksData, rateData, gradients]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#334155' } },
      title: { display: true, text: 'Impresiones, Clics y Tasa Diaria (LinkedIn)', color: '#0f172a' },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) => {
            if (item.dataset.label === 'Tasa de Interacción') {
              const v = Number(item.raw);
              return `${item.dataset.label}: ${(v * 100).toFixed(1)}%`;
            }
            return `${item.dataset.label}: ${item.formattedValue}`;
          }
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
      },
      y1: {
        position: 'right',
        ticks: {
          color: '#475569',
          callback: (val) => `${Number(val) * 100}%`
        },
        grid: { drawOnChartArea: false },
        suggestedMin: 0,
        suggestedMax: 1,
        title: { display: true, text: 'Tasa', color: '#334155' }
      }
    }
  }), []);

  if (loading) return <div className="p-4 text-slate-500">Cargando…</div>;
  if (!labels.length) return (
    <div className="p-4 text-slate-500">
      No hay datos disponibles
      <div className="text-xs mt-1">Colección: linkedin_metrics. Campos esperados: impressions, clicks y timestamp (Timestamp/epoch) o epochMs.</div>
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
          <div><strong>Colección:</strong> linkedin_metrics</div>
          <div><strong>Labels:</strong> {labels.slice(0,5).join(', ')}{labels.length > 5 ? '…' : ''}</div>
          <div><strong>Impresiones (primeros 5):</strong> {impData.slice(0,5).join(', ')}{impData.length > 5 ? '…' : ''}</div>
          <div><strong>Clics (primeros 5):</strong> {clicksData.slice(0,5).join(', ')}{clicksData.length > 5 ? '…' : ''}</div>
        </div>
      )}
      <Line ref={canvasRef} data={data} options={options} />
    </div>
  );
};

export default LinkedInLineChart;
