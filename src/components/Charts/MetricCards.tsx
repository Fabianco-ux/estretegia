import React from 'react';
import type { ChartPoint } from '../../types/metrics';
import { exportMetricsToPDF } from '../../utils/pdfExport';
import { sendEmailReport, sendToDashboard } from '../../services/n8nApi';
import { sendChatMessage } from '../../services/aiService';

interface MetricCardsProps {
  points: ChartPoint[];
  rangeLabel: string;
  modeLabel: string;
  onRefresh: () => Promise<void> | void;
}

function computeSummary(points: ChartPoint[]) {
  const totals = points.reduce(
    (acc, p) => ({
      linkedin: acc.linkedin + (p.linkedin ?? 0),
      instagram: acc.instagram + (p.instagram ?? 0),
      ga: acc.ga + (p.ga ?? 0),
    }),
    { linkedin: 0, instagram: 0, ga: 0 }
  );
  const count = Math.max(points.length, 1);
  const averages = {
    linkedin: Math.round(totals.linkedin / count),
    instagram: Math.round(totals.instagram / count),
    ga: Math.round(totals.ga / count),
  };
  const maxes = points.reduce(
    (acc, p) => ({
      linkedin: Math.max(acc.linkedin, p.linkedin ?? 0),
      instagram: Math.max(acc.instagram, p.instagram ?? 0),
      ga: Math.max(acc.ga, p.ga ?? 0),
    }),
    { linkedin: 0, instagram: 0, ga: 0 }
  );
  return { totals, averages, maxes, count };
}

export default function MetricCards({ points, rangeLabel, modeLabel, onRefresh }: MetricCardsProps) {
  const [emailStatus, setEmailStatus] = React.useState<string>('');
  const [dashboardStatus, setDashboardStatus] = React.useState<string>('');
  const [insight, setInsight] = React.useState<string>('');

  const summary = computeSummary(points);

  const handleExportPDF = () => {
    exportMetricsToPDF(points, { title: 'Reporte de Métricas' });
  };

  const handleSendEmail = async () => {
    try {
      await sendEmailReport({
        title: 'Reporte semanal de métricas',
        range: rangeLabel,
        mode: modeLabel,
        summary,
        points,
      });
      setEmailStatus('Informe enviado correctamente.');
    } catch (e) {
      setEmailStatus('Error al enviar el informe.');
    }
  };

  const handleSendDashboard = async () => {
    try {
      await sendToDashboard({ summary, points });
      setDashboardStatus('Datos enviados al dashboard externo.');
    } catch (e) {
      setDashboardStatus('Error al enviar al dashboard externo.');
    }
  };

  const handleGenerateInsights = async () => {
    try {
      const text = `Genera un breve análisis de tendencias para LinkedIn, Instagram y GA con estos totales: ` +
        `LinkedIn ${summary.totals.linkedin}, Instagram ${summary.totals.instagram}, GA ${summary.totals.ga} ` +
        `en rango ${rangeLabel} y modo ${modeLabel}.`;
      const res = await sendChatMessage('dashboard-insights', text);
      setInsight(res.message?.content ?? '');
    } catch (e) {
      setInsight('No fue posible generar el insight.');
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Totales */}
      <div className="bg-white shadow-soft rounded p-4">
        <div className="text-sm text-gray-500 mb-1">Totales ({rangeLabel})</div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">LinkedIn</span>
          <span className="font-semibold">{summary.totals.linkedin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Instagram</span>
          <span className="font-semibold">{summary.totals.instagram}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">GA</span>
          <span className="font-semibold">{summary.totals.ga}</span>
        </div>
      </div>

      {/* Promedios */}
      <div className="bg-white shadow-soft rounded p-4">
        <div className="text-sm text-gray-500 mb-1">Promedio diario ({modeLabel})</div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">LinkedIn</span>
          <span className="font-semibold">{summary.averages.linkedin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Instagram</span>
          <span className="font-semibold">{summary.averages.instagram}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">GA</span>
          <span className="font-semibold">{summary.averages.ga}</span>
        </div>
      </div>

      {/* Máximo diario */}
      <div className="bg-white shadow-soft rounded p-4">
        <div className="text-sm text-gray-500 mb-1">Máximo diario</div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">LinkedIn</span>
          <span className="font-semibold">{summary.maxes.linkedin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Instagram</span>
          <span className="font-semibold">{summary.maxes.instagram}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">GA</span>
          <span className="font-semibold">{summary.maxes.ga}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white shadow-soft rounded p-4">
        <div className="text-sm text-gray-500 mb-2">Acciones</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-white text-black border-2 border-[#00eaff] rounded hover:shadow-[0_0_12px_#00eaff] transition"
          >
            Refrescar
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-white text-black border-2 border-[#00eaff] rounded hover:shadow-[0_0_12px_#00eaff] transition"
          >
            PDF
          </button>
          <button
            onClick={handleSendEmail}
            className="px-3 py-2 bg-white text-black border-2 border-[#00eaff] rounded hover:shadow-[0_0_12px_#00eaff] transition"
          >
            Email
          </button>
          <button
            onClick={handleSendDashboard}
            className="px-3 py-2 bg-white text-black border-2 border-[#00eaff] rounded hover:shadow-[0_0_12px_#00eaff] transition"
          >
            Dashboard
          </button>
          <button
            onClick={handleGenerateInsights}
            className="px-3 py-2 bg-white text-black border-2 border-[#00eaff] rounded hover:shadow-[0_0_12px_#00eaff] transition"
          >
            Insight IA
          </button>
        </div>
        {(emailStatus || dashboardStatus || insight) && (
          <div className="mt-3 text-xs text-gray-700">
            {emailStatus && <div>{emailStatus}</div>}
            {dashboardStatus && <div>{dashboardStatus}</div>}
            {insight && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded">{insight}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
