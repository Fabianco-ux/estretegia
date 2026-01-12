import React from 'react';
import type { ChartPoint } from '../../types/metrics';

interface PerformanceChartProps {
  data: ChartPoint[];
  yScaleMode: 'auto' | 'fixed';
  fixedMax?: number;
  onToggleSeries?: (key: keyof ChartPoint) => void;
}

// Componente placeholder: el gráfico original con Recharts se ha retirado.
// Mantener este stub evita errores de compilación por referencias antiguas.
export default function PerformanceChart(_props: PerformanceChartProps) {
  return (
    <div className="w-full h-80 flex items-center justify-center border rounded text-slate-500">
      Gráfico retirado. Usa los nuevos componentes Chart.js.
    </div>
  );
}
