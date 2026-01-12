import jsPDF from 'jspdf';
import type { ChartPoint } from '../types/metrics';

export function exportMetricsToPDF(points: ChartPoint[], options?: { title?: string }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const lineHeight = 18;
  const title = options?.title ?? 'Reporte de Métricas';

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, margin, margin);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, margin, margin + 22);

  // Table header
  let y = margin + 60;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha', margin, y);
  doc.text('LinkedIn', margin + 140, y);
  doc.text('Instagram', margin + 260, y);
  doc.text('Analytics', margin + 380, y);
  doc.setFont('helvetica', 'normal');

  y += 12;
  doc.setLineWidth(0.5);
  doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
  y += 12;

  // Rows
  points.forEach((p) => {
    if (y > doc.internal.pageSize.getHeight() - margin - 20) {
      doc.addPage();
      y = margin;
    }
    doc.text(p.date, margin, y);
    doc.text(String(p.linkedin ?? ''), margin + 140, y);
    doc.text(String(p.instagram ?? ''), margin + 260, y);
    doc.text(String(p.ga ?? ''), margin + 380, y);
    y += lineHeight;
  });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
