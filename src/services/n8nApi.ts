import axios from 'axios';

const baseURL = import.meta.env.VITE_N8N_BASE_URL || '';

export interface MetricPoint {
  date: string; // ISO date
  value: number;
  category: 'linkedin' | 'instagram' | 'ga';
}

export async function getLinkedInMetrics() {
  const { data } = await axios.get(`${baseURL}/linkedin/metrics`);
  return data as MetricPoint[];
}

export async function getInstagramMetrics() {
  const { data } = await axios.get(`${baseURL}/instagram/metrics`);
  return data as MetricPoint[];
}

export async function getGoogleAnalyticsMetrics() {
  const { data } = await axios.get(`${baseURL}/ga/metrics`);
  return data as MetricPoint[];
}

export async function getMergedMetrics(params?: Record<string, string | number>) {
  const { data } = await axios.get(`${baseURL}/merged/metrics`, { params });
  return data as MetricPoint[];
}

export async function sendToDashboard(payload: any) {
  const { data } = await axios.post(`${baseURL}/dashboard/send`, payload);
  return data;
}

export async function sendEmailReport(payload: any) {
  const { data } = await axios.post(`${baseURL}/email/report`, payload);
  return data;
}
