import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export const THEME_COLORS = {
  dark: {
    bg:       '#0D0D0D',
    surface:  '#1A1A1A',
    surface2: '#252525',
    border:   'rgba(255,255,255,0.08)',
    text:     '#FFFFFF',
    textSub:  'rgba(255,255,255,0.55)',
    card:     '#1E1E1E',
  },
  light: {
    bg:       '#FFFFFF',
    surface:  '#F5F5F5',
    surface2: '#EBEBEB',
    border:   'rgba(0,0,0,0.08)',
    text:     '#1A1A1A',
    textSub:  'rgba(0,0,0,0.45)',
    card:     '#FFFFFF',
  },
} as const;

export type ThemeColors = typeof THEME_COLORS.dark;

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      toggle: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'BOSKO_THEME_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);

export const useThemeMode   = () => useThemeStore((s) => s.mode);
export const useThemeColors = () => THEME_COLORS[useThemeStore((s) => s.mode)];
export const useToggleTheme = () => useThemeStore((s) => s.toggle);
export const useIsDark      = () => useThemeStore((s) => s.mode === 'dark');
