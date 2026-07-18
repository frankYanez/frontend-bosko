// Fuente única de la paleta dark/light. src/stores/theme.store.ts importa esto
// y solo se queda con la lógica de toggle/persist (Zustand) — el store no
// define color acá.
export const PALETTE = {
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

export type PaletteColors = typeof PALETTE.dark;
