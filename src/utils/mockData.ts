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

export function generateMockSeries(labels: string[], base: number, variance: number) {
  const out: number[] = [];
  let trend = 0;
  for (let i = 0; i < labels.length; i++) {
    trend += (Math.random() - 0.5) * (variance * 0.05);
    const noise = (Math.random() - 0.5) * variance;
    const value = Math.max(0, Math.round(base + trend + noise));
    out.push(value);
  }
  return out;
}

// Variante acotada: sin tendencia acumulada y con límite superior
export function generateMockSeriesCapped(labels: string[], base: number, variance: number, maxValue: number) {
  const out: number[] = [];
  for (let i = 0; i < labels.length; i++) {
    const noise = (Math.random() - 0.5) * variance;
    const value = Math.min(maxValue, Math.max(0, Math.round(base + noise)));
    out.push(value);
  }
  return out;
}

export function generateMockRate(clicks: number[], impressions: number[], min = 0) {
  const rate: number[] = [];
  for (let i = 0; i < clicks.length; i++) {
    const imp = impressions[i] || 0;
    const clk = clicks[i] || 0;
    rate.push(imp > 0 ? Math.max(min, clk / imp) : 0);
  }
  return rate;
}

export function sum(arr: number[]) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export function average(arr: number[]) {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}
