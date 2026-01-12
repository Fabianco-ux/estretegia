import React, { useMemo, useState } from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { useMetrics } from '../hooks/useMetrics';
import { KPICard } from '../components/KPICard';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { isEmbedMode } from '../utils/embed';

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [selectedSource, setSelectedSource] = useState<'all' | 'linkedin' | 'google_analytics'>('all');
  // Habilitar métricas solo cuando la autenticación (incluida anónima) esté lista
  const metricsEnabled = !authLoading;
  const { byDayAnalytics, byDayLinkedIn, analyticsData, linkedinData, loading, error } = useMetrics(days, metricsEnabled, selectedSource);

  // Modo de datos ficticios solicitados
  const USE_FAKE = true;

  const lastNDates = (n: number) => {
    const out: string[] = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  };

  const analyticsKpi = useMemo(() => {
    let totalUsers = 0, sessions = 0, durations: number[] = [];
    analyticsData.forEach((d: any) => {
      const k = d.kpis || d;
      totalUsers += Number(k.totalUsers ?? 0);
      sessions += Number(k.sessions ?? 0);
      if (k.sessionDuration != null) durations.push(Number(k.sessionDuration));
    });
    const avgSessionDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return { totalUsers, sessions, avgSessionDuration };
  }, [analyticsData]);

  const linkedinKpi = useMemo(() => {
    let impressions = 0, clicks = 0;
    linkedinData.forEach((d: any) => {
      const k = d.kpis || d;
      impressions += Number(k.impressions ?? 0);
      clicks += Number(k.clicks ?? 0);
    });
    const interactionRate = impressions ? clicks / impressions : 0;
    return { impressions, clicks, interactionRate };
  }, [linkedinData]);

  // Datos ficticios para gráficos y tarjetas
  const fakeDates = useMemo(() => lastNDates(7), []);
  const fakeByDayAnalytics = useMemo(() => fakeDates.map(date => ({ date, usuarios: 2, sesiones: 6 })), [fakeDates]);
  const fakeByDayLinkedIn = useMemo(() => {
    // Distribuir 67 impresiones y 34 clics en 7 días
    const imp = [10, 10, 9, 9, 9, 10, 10]; // suma 67
    const clk = [5, 5, 5, 5, 4, 5, 5];      // suma 34
    return fakeDates.map((date, i) => ({ date, impressions: imp[i] ?? 9, clicks: clk[i] ?? 4 }));
  }, [fakeDates]);
  const analyticsKpiDisplay = USE_FAKE ? { totalUsers: 2, sessions: 6, avgSessionDuration: 50 } : analyticsKpi;
  const linkedinKpiDisplay = USE_FAKE ? { impressions: 67, clicks: 34, interactionRate: 1.0298 } : linkedinKpi;
  const byDayAnalyticsDisplay = USE_FAKE ? fakeByDayAnalytics : byDayAnalytics;
  const byDayLinkedInDisplay = USE_FAKE ? fakeByDayLinkedIn : byDayLinkedIn;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className={isEmbedMode() ? "container flex py-0" : "container flex gap-6 py-6"}>
        <Sidebar />
        <main className={isEmbedMode() ? "flex-1 min-w-0 min-h-0" : "flex-1 min-w-0 min-h-0"}>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Rango:</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={7}>Últimos 7 días</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
            </select>
            <label className="text-sm text-gray-600 ml-4">Fuente:</label>
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="all">Todas</option>
              <option value="google_analytics">Google Analytics</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          {loading && <div className="bg-white rounded p-4 shadow-soft">Cargando…</div>}
          {error && <div className="bg-red-50 text-red-700 rounded p-4 shadow-soft">{error}</div>}

          {/* Sección 1: Métricas Web (Google Analytics) */}
          <section className="bg-white shadow-soft rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Métricas Web (Analytics)</h2>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <KPICard title="Total de Usuarios" value={analyticsKpiDisplay.totalUsers || 0} />
              <KPICard title="Total de Sesiones" value={analyticsKpiDisplay.sessions || 0} />
              <KPICard title="Duración Media Sesión (s)" value={Math.round(analyticsKpiDisplay.avgSessionDuration || 0)} invertTrend />
            </div>
            {/* Tarjetas adicionales solicitadas (Analytics) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              <KPICard title="Usuarios activos" value={2} />
              <KPICard title="Número de eventos" value={6} />
              <KPICard title="Eventos clave" value={0} invertTrend />
              <KPICard title="Usuarios" value={2} />
            </div>

            {/* Gráfico de Líneas (Recharts): Usuarios y Sesiones Diarias */}
            <div className="w-full min-w-0">
                <ResponsiveContainer width="100%" height={320}>
                <LineChart data={byDayAnalyticsDisplay} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" name="Usuarios" dot={false} />
                  <Line type="monotone" dataKey="sesiones" stroke="#10b981" name="Sesiones" dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>

            {/* (Opcional) Sección eliminada: gráfico Donut de fuentes de tráfico (Recharts) */}
          </section>

          {/* Sección 2: Métricas de LinkedIn */}
          <section className="bg-white shadow-soft rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Métricas de LinkedIn</h2>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <KPICard title="Total de Impresiones" value={linkedinKpiDisplay.impressions || 0} />
              <KPICard title="Total de Clics" value={linkedinKpiDisplay.clicks || 0} />
              <KPICard title="Tasa de Interacción" value={`${((linkedinKpiDisplay.interactionRate || 0) * 100).toFixed(2)}%`} />
            </div>
            {/* Tarjetas adicionales solicitadas (LinkedIn) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <KPICard title="Apariciones en búsquedas" value={12} trend={1100} />
              <KPICard title="Nuevos seguidores" value={34} />
              <KPICard title="Impresiones de la publicación" value={67} trend={737.5} />
            </div>

            {/* Gráfico de Líneas (Recharts): Impresiones y Clics por día */}
            <div className="w-full min-w-0">
                <ResponsiveContainer width="100%" height={320}>
                <LineChart data={byDayLinkedInDisplay} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" name="Impresiones" dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" name="Clics" dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
