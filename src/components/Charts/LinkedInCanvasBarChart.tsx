import React from 'react';

type Metric = {
  nombre: string;
  valor: number;
  color: string;
};

interface LinkedInCanvasBarChartProps {
  titulo?: string;
  datos?: Array<{ nombre: string; valor: number }>;
}

const COLORES = [
  '#003366', // Azul oscuro
  '#336699', // Azul medio
  '#CCCCCC', // Gris claro
  '#000000', // Negro
];

export default function LinkedInCanvasBarChart({ titulo = 'Métricas de LinkedIn', datos }: LinkedInCanvasBarChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 800, h: 400 });

  const metrics: Metric[] = React.useMemo(() => {
    const base = datos ?? [
      { nombre: 'Impresiones', valor: 12000 },
      { nombre: 'Clics', valor: 380 },
      { nombre: 'Reacciones', valor: 260 },
      { nombre: 'Seguidores', valor: 20450 },
    ];
    return base.map((m, i) => ({ ...m, color: COLORES[i % COLORES.length] }));
  }, [datos]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.max(300, Math.floor(entry.contentRect.width));
        const height = Math.max(240, Math.floor(width * 0.5));
        setSize({ w: width, h: height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size.w;
    const H = size.h;
    canvas.width = W;
    canvas.height = H;

    // Márgenes y estilo
    const m = { top: 40, right: 20, bottom: 60, left: 60 };
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Título
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(titulo, m.left, m.top - 16);

    const chartW = W - m.left - m.right;
    const chartH = H - m.top - m.bottom;
    const originX = m.left;
    const originY = H - m.bottom;

    // Escala Y
    const maxVal = Math.max(...metrics.map((m) => m.valor));
    const niceMax = Math.ceil(maxVal / 5) * 5;
    const scaleY = (v: number) => (v / niceMax) * chartH;

    // Ejes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(originX, m.top);
    ctx.lineTo(originX, originY);
    ctx.stroke();
    // Eje X
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + chartW, originY);
    ctx.stroke();

    // Ticks Y y etiquetas
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const yVal = (niceMax / steps) * i;
      const y = originY - scaleY(yVal);
      // línea guía
      ctx.strokeStyle = '#CCCCCC';
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + chartW, y);
      ctx.stroke();
      // etiqueta
      ctx.fillStyle = '#000000';
      ctx.fillText(String(Math.round(yVal)), originX - 8, y + 4);
    }

    // Barras
    const barAreaW = chartW;
    const barCount = metrics.length;
    const gap = 20;
    const barW = Math.max(20, Math.floor((barAreaW - gap * (barCount + 1)) / barCount));
    ctx.textAlign = 'center';

    metrics.forEach((mtr, idx) => {
      const x = originX + gap + idx * (barW + gap);
      const h = scaleY(mtr.valor);
      const y = originY - h;
      // barra
      ctx.fillStyle = mtr.color;
      ctx.fillRect(x, y, barW, h);
      // borde
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(x, y, barW, h);
      // etiqueta X
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(mtr.nombre, x + barW / 2, originY + 18);
      // valor encima
      ctx.font = '11px Arial';
      ctx.fillText(String(mtr.valor), x + barW / 2, y - 6);
    });
  }, [metrics, size]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} style={{ width: size.w, height: size.h }} />
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {metrics.map((m) => (
          <div key={m.nombre} className="flex items-center gap-2 text-sm">
            <span style={{ backgroundColor: m.color }} className="inline-block w-3 h-3 border border-black" />
            <span className="text-gray-800">{m.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
