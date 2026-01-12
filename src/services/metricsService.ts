import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getDb } from './firebaseClient';
import { getDateRangeDays, type RangeOption } from '../utils/dateUtils';

function toISODate(ts: string | number | Date): string {
  const d = ts instanceof Date ? ts : new Date(typeof ts === 'number' ? ts : ts);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function startEndForRange(range: RangeOption) {
  const days = getDateRangeDays(range);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
}

// --- Analytics (Google Analytics) ---
export async function fetchAnalyticsKPIs(range: RangeOption) {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'analytics_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()));
  const snap = await getDocs(q);
  let totalUsers = 0;
  let sessions = 0;
  let durations: number[] = [];
  snap.forEach(doc => {
    const d = doc.data() as any;
    totalUsers += Number(d.totalUsers ?? 0);
    sessions += Number(d.sessions ?? 0);
    if (d.sessionDuration != null) durations.push(Number(d.sessionDuration));
  });
  const avgSessionDuration = durations.length
    ? durations.reduce((a, b) => a + (Number.isFinite(b) ? Number(b) : 0), 0) / durations.length
    : 0;
  return { totalUsers, sessions, avgSessionDuration };
}

export async function fetchAnalyticsDaily(range: RangeOption) {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'analytics_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()), orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  const byDay: Record<string, { usuarios: number; sesiones: number; }> = {};
  snap.forEach(doc => {
    const d = doc.data() as any;
    const day = toISODate(d.timestamp ?? Date.now());
    byDay[day] = byDay[day] || { usuarios: 0, sesiones: 0 };
    byDay[day].usuarios += Number(d.totalUsers ?? 0);
    byDay[day].sesiones += Number(d.sessions ?? 0);
  });
  return Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b)).map(([date, v]) => ({ date, usuarios: v.usuarios, sesiones: v.sesiones }));
}

export async function fetchTrafficSources(range: RangeOption) {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'analytics_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()));
  const snap = await getDocs(q);
  const agg: Record<string, number> = {};
  let totalSessions = 0;
  snap.forEach(doc => {
    const d = doc.data() as any;
    const source = String(d.trafficSource ?? 'Desconocido');
    const s = Number(d.sessions ?? 0);
    agg[source] = (agg[source] ?? 0) + s;
    totalSessions += s;
  });
  const items = Object.entries(agg).map(([name, value]) => ({ name, value }));
  items.sort((a,b) => b.value - a.value);
  const top5 = items.slice(0,5);
  return top5.map(i => ({ ...i, percentage: totalSessions ? (i.value / totalSessions) * 100 : 0 }));
}

// --- LinkedIn ---
export async function fetchLinkedInKPIs(range: RangeOption) {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'linkedin_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()));
  const snap = await getDocs(q);
  let impressions = 0;
  let clicks = 0;
  if (snap.size > 0) {
    snap.forEach(doc => {
      const d = doc.data() as any;
      impressions += Number(d.impressions ?? 0);
      clicks += Number(d.clicks ?? 0);
    });
  }
  const interactionRate = impressions ? clicks / impressions : 0;
  return { impressions, clicks, interactionRate };
}

export async function fetchLinkedInTopPosts(range: RangeOption, metric: 'impressions' | 'clicks') {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'linkedin_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()));
  const snap = await getDocs(q);
  const agg: Record<string, { title: string; impressions: number; clicks: number; }> = {};
  snap.forEach(doc => {
    const d = doc.data() as any;
    const id = String(d.postId ?? d.id ?? 'Desconocido');
    const title = String(d.title ?? id);
    agg[id] = agg[id] || { title, impressions: 0, clicks: 0 };
    agg[id].impressions += Number(d.impressions ?? 0);
    agg[id].clicks += Number(d.clicks ?? 0);
  });
  const items = Object.entries(agg).map(([id, v]) => ({ id, title: v.title, value: metric === 'impressions' ? v.impressions : v.clicks }));
  items.sort((a,b) => b.value - a.value);
  return items.slice(0, 5);
}

export async function fetchLinkedInFollowers(range: RangeOption) {
  const db = getDb();
  const { start, end } = startEndForRange(range);
  const col = collection(db, 'linkedin_metrics');
  const q = query(col, where('timestamp', '>=', start.getTime()), where('timestamp', '<=', end.getTime()), orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  const byDay: Record<string, number> = {};
  snap.forEach(doc => {
    const d = doc.data() as any;
    const day = toISODate(d.timestamp ?? Date.now());
    byDay[day] = Number(d.followers ?? byDay[day] ?? 0);
  });
  return Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b)).map(([date, followers]) => ({ date, followers }));
}
