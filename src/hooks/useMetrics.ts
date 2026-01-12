import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export interface LinkedInKpis {
  impressions?: number;
  clicks?: number;
  interactionRate?: number;
  followers?: number;
  [key: string]: unknown;
}

export interface AnalyticsKpis {
  date?: string;
  totalUsers?: number;
  sessions?: number;
  totalPageViews?: number;
  bounceRate?: number;
  sessionDuration?: number;
  [key: string]: unknown;
}

export interface LinkedInMetric {
  id: string;
  source: 'linkedin';
  timestamp: string | number | Date;
  epochMs?: number;
  dataType?: string;
  stream?: 'ads' | 'organization' | string;
  kpis?: LinkedInKpis;
  metrics?: Record<string, unknown> | Array<Record<string, unknown>>; // compat con backend actual
}

export interface AnalyticsMetric {
  id: string;
  source: 'google_analytics' | 'analytics' | string;
  timestamp: string | number | Date;
  epochMs?: number;
  dataType?: string;
  kpis?: AnalyticsKpis;
  [key: string]: unknown;
}

function toMs(t: string | number | Date): number {
  if (typeof t === 'number') return t;
  const d = t instanceof Date ? t : new Date(t);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

export function useMetrics(
  days: number = 7,
  enabled: boolean = true,
  source: 'all' | 'linkedin' | 'google_analytics' = 'all'
) {
  const [linkedinData, setLinkedinData] = useState<LinkedInMetric[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLinkedinData([]);
      setAnalyticsData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const startMs = Date.now() - days * 24 * 60 * 60 * 1000;

    const linRef = collection(db, 'linkedin_metrics');
    const gaRef = collection(db, 'analytics_metrics');

    const linQ = query(linRef, orderBy('epochMs', 'asc'));
    const gaQ = query(gaRef, orderBy('epochMs', 'asc'));

      const unsubLin = (source === 'all' || source === 'linkedin') ? onSnapshot(linQ, (snap) => {
      const items: LinkedInMetric[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as DocumentData;
        const epochMs = typeof d.epochMs === 'number' ? d.epochMs : toMs(d.timestamp);
        if (epochMs >= startMs) {
          items.push({ id: doc.id, epochMs, source: (d.source as any) || 'linkedin', timestamp: d.timestamp || epochMs, ...d });
        }
      });
      setLinkedinData(items);
      }, (err) => {
        console.error('Firestore Error (LinkedIn):', err);
        setError(err?.message || 'Error desconocido al cargar LinkedIn');
        setLoading(false);
      }) : undefined;

      const unsubGa = (source === 'all' || source === 'google_analytics') ? onSnapshot(gaQ, (snap) => {
      const items: AnalyticsMetric[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as DocumentData;
        const epochMs = typeof d.epochMs === 'number' ? d.epochMs : toMs(d.timestamp);
        if (epochMs >= startMs) {
          items.push({ id: doc.id, epochMs, source: (d.source as any) || 'google_analytics', timestamp: d.timestamp || epochMs, ...d });
        }
      });
      setAnalyticsData(items);
      }, (err) => {
        console.error('Firestore Error (Analytics):', err);
        setError(err?.message || 'Error desconocido al cargar Analytics');
        setLoading(false);
      }) : undefined;

    setLoading(false);

    return () => {
        try { unsubLin && unsubLin(); } catch {}
        try { unsubGa && unsubGa(); } catch {}
    };
  }, [days, enabled, source]);

  const byDayAnalytics = useMemo(() => {
    const map = new Map<string, { date: string; usuarios: number; sesiones: number; pageViews: number }>();
    analyticsData.forEach((d) => {
      const day = new Date(d.epochMs ?? toMs(d.timestamp)).toISOString().slice(0, 10);
      const k = d.kpis || (d as any).kpis || (d as any);
      const usuarios = Number(k.totalUsers ?? (d as any).totalUsers ?? 0);
      const sesiones = Number(k.sessions ?? (d as any).sessions ?? 0);
      const pageViews = Number(k.totalPageViews ?? (d as any).totalPageViews ?? 0);
      const prev = map.get(day) || { date: day, usuarios: 0, sesiones: 0, pageViews: 0 };
      prev.usuarios += usuarios;
      prev.sesiones += sesiones;
      prev.pageViews += pageViews;
      map.set(day, prev);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData]);

  const byDayLinkedIn = useMemo(() => {
    const map = new Map<string, { date: string; impressions: number; clicks: number }>();
    linkedinData.forEach((d) => {
      const day = new Date(d.epochMs ?? toMs(d.timestamp)).toISOString().slice(0, 10);
      const k = d.kpis || (d as any).kpis || (d as any);
      const impressions = Number(k.impressions ?? (d as any).impressions ?? 0);
      const clicks = Number(k.clicks ?? (d as any).clicks ?? 0);
      const prev = map.get(day) || { date: day, impressions: 0, clicks: 0 };
      prev.impressions += impressions;
      prev.clicks += clicks;
      map.set(day, prev);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [linkedinData]);

  return { linkedinData, analyticsData, byDayAnalytics, byDayLinkedIn, loading, error };
}
