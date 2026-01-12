import { db } from '../firebase';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';

export type RawMetricDoc = Record<string, any> & { timestamp?: string | number | Date; epochMs?: number };

export async function fetchMetricsData(collectionName: string, startDate: Date, endDate: Date) {
  const col = collection(db, collectionName);
  const start = startDate.getTime();
  const end = endDate.getTime();

  // Intentos de consulta con distintos tipos de 'timestamp'
  let q = query(col, where('timestamp', '>=', start), where('timestamp', '<=', end), orderBy('timestamp', 'asc'));
  let snap = await getDocs(q);

  if (snap.size === 0) {
    const tsStart = Timestamp.fromDate(new Date(start));
    const tsEnd = Timestamp.fromDate(new Date(end));
    try {
      q = query(col, where('timestamp', '>=', tsStart), where('timestamp', '<=', tsEnd), orderBy('timestamp', 'asc'));
      snap = await getDocs(q);
    } catch {
      // Si falla por tipos mixtos, seguimos a siguiente alternativa
    }
  }

  if (snap.size === 0) {
    q = query(col, where('epochMs', '>=', start), where('epochMs', '<=', end), orderBy('epochMs', 'asc'));
    snap = await getDocs(q);
  }

  // Último recurso: obtener todo y normalizar/filtrar en cliente (maneja strings y campos alternativos)
  if (snap.size === 0) {
    snap = await getDocs(col);
  }

  const rawItems: RawMetricDoc[] = [];
  snap.forEach(doc => rawItems.push(doc.data() as RawMetricDoc));

  const normalized = rawItems.map(normalizeDoc);
  const filtered = normalized.filter(it => {
    const t = typeof it.timestamp === 'number' ? it.timestamp : (typeof it.epochMs === 'number' ? it.epochMs : null);
    return t != null && t >= start && t <= end;
  });
  // Ordenar por tiempo ascendente para gráficos
  filtered.sort((a, b) => {
    const ta = typeof a.timestamp === 'number' ? a.timestamp : (a.epochMs ?? 0);
    const tb = typeof b.timestamp === 'number' ? b.timestamp : (b.epochMs ?? 0);
    return ta - tb;
  });
  return filtered;
}

function parsePotentialDate(input: any): number | null {
  if (!input) return null;
  // Firestore Timestamp
  if (input && typeof input.toMillis === 'function') {
    try { return Number(input.toMillis()); } catch { /* noop */ }
  }
  // Número epoch
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  // String ISO o con zona horaria
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function normalizeDoc(d: any): RawMetricDoc {
  const out: RawMetricDoc = { ...d };

  // Normalizar timestamp/epochMs desde varios campos
  let t: number | null = parsePotentialDate(d.timestamp);
  if (t == null && d['Marca temporal']) t = parsePotentialDate(d['Marca temporal']);
  if (t == null && d['marcaTemporal']) t = parsePotentialDate(d['marcaTemporal']);
  if (t == null && d['datetime']) t = parsePotentialDate(d['datetime']);
  if (t == null && d['Fecha']) {
    // Ejemplo: '20251222' (YYYYMMDD) o número similar
    const f = String(d['Fecha']);
    if (f.length === 8) {
      const y = Number(f.slice(0, 4));
      const m = Number(f.slice(4, 6));
      const day = Number(f.slice(6, 8));
      const dt = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));
      t = dt.getTime();
    }
  }
  if (t != null) {
    out.timestamp = t;
    out.epochMs = t;
  }

  // Mapear campos alternativos a llaves estándar usadas por los gráficos
  // Analytics: sesiones/usuarios
  if (out.sessions == null && d['VisualizacionesPágina'] != null) {
    const v = Number(d['VisualizacionesPágina']);
    out.sessions = Number.isFinite(v) ? v : 0;
  }
  if (out.totalUsers == null) {
    if (d.totalUsers != null) {
      const v = Number(d.totalUsers);
      out.totalUsers = Number.isFinite(v) ? v : 0;
    } else if (d.active1DayUsers != null) {
      const v = Number(d.active1DayUsers);
      out.totalUsers = Number.isFinite(v) ? v : 0;
    }
  }

  // LinkedIn: impresiones/clics posibles alias (por si vinieran con nombres distintos)
  if (out.impressions == null && d['impresiones'] != null) {
    const v = Number(d['impresiones']);
    out.impressions = Number.isFinite(v) ? v : 0;
  }
  if (out.clicks == null && d['clics'] != null) {
    const v = Number(d['clics']);
    out.clicks = Number.isFinite(v) ? v : 0;
  }

  return out;
}
