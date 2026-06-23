import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export const THEME_COLORS = {
  dark: {
    // Fondos
    bg:           '#0B0A0F',
    bgGlow:       'rgba(133,0,33,0.16)',
    bgGlowFade:   'rgba(133,0,33,0.0)',
    surface:      '#131118',
    surface2:     '#1C1925',
    card:         '#18151F',
    cardBorder:   'rgba(255,255,255,0.07)',

    // Texto
    text:         '#F2F0F8',
    textSub:      'rgba(242,240,248,0.52)',
    textMuted:    'rgba(242,240,248,0.28)',

    // UI
    border:       'rgba(255,255,255,0.08)',
    divider:      'rgba(255,255,255,0.05)',
    overlay:      'rgba(0,0,0,0.70)',
    accent:       'rgba(133,0,33,0.15)',

    // Brand
    primary:      '#850021',
    primaryLight: '#C0002F',
  },
  light: {
    // Fondos
    bg:           '#F9F7FB',
    bgGlow:       'rgba(133,0,33,0.06)',
    bgGlowFade:   'rgba(133,0,33,0.0)',
    surface:      '#FFFFFF',
    surface2:     '#F0EDF5',
    card:         '#FFFFFF',
    cardBorder:   'rgba(0,0,0,0.06)',

    // Texto
    text:         '#1A1520',
    textSub:      'rgba(26,21,32,0.52)',
    textMuted:    'rgba(26,21,32,0.32)',

    // UI
    border:       'rgba(0,0,0,0.07)',
    divider:      'rgba(0,0,0,0.05)',
    overlay:      'rgba(0,0,0,0.40)',
    accent:       'rgba(133,0,33,0.06)',

    // Brand
    primary:      '#850021',
    primaryLight: '#C0002F',
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
