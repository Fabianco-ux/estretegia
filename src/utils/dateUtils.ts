export type RangeOption = '7d' | '15d' | '30d';
export type ModeOption = 'acumulado' | 'diario';

export function getDateRangeDays(range: RangeOption): number {
  switch (range) {
    case '7d': return 7;
    case '15d': return 15;
    case '30d': return 30;
    default: return 7;
  }
}

// Genera etiquetas diarias ISO (YYYY-MM-DD) entre dos fechas inclusive.
export function generateDailyLabels(startDate: Date, endDate: Date) {
  const labels: string[] = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    labels.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return labels;
}
