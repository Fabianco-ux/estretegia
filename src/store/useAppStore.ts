import { create } from 'zustand';

export type RangeOption = '7d' | '15d' | '30d';
export type ModeOption = 'acumulado' | 'diario';
export type YScaleOption = 'auto' | 'fixed';

interface AppState {
  // filtros del dashboard
  range: RangeOption;
  mode: ModeOption;
  yScale: YScaleOption;
  setRange: (r: RangeOption) => void;
  setMode: (m: ModeOption) => void;
  setYScale: (y: YScaleOption) => void;
  // usuario
  userName?: string;
  avatarUrl?: string;
  setUser: (userName?: string, avatarUrl?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  range: '7d',
  mode: 'diario',
  yScale: 'auto',
  setRange: (range) => set({ range }),
  setMode: (mode) => set({ mode }),
  setYScale: (yScale) => set({ yScale }),
  setUser: (userName, avatarUrl) => set({ userName, avatarUrl })
}));
