// Fuente única de la paleta dark/light — "Señal Nocturna".
// Cambios vs. la paleta actual: bg más profundo, superficies pasan a vidrio
// translúcido (para backdrop-blur / BlurView), se agrega signal + mint.
export const PALETTE = {
  dark: {
    // Fondos
    bg:           '#0A0910',   // antes #0B0A0F
    bgGlow:       'rgba(255,45,111,0.18)',   // antes bordo — ahora rosa señal
    bgGlowFade:   'rgba(255,45,111,0.0)',
    surface:      '#131118',
    surface2:     'rgba(255,255,255,0.06)',  // antes sólido #1C1925 — ahora vidrio
    card:         'rgba(255,255,255,0.045)', // antes sólido #18151F — ahora vidrio + blur
    cardBorder:   'rgba(255,255,255,0.09)',

    // Texto
    text:         '#EDEAF5',   // antes #F2F0F8
    textSub:      'rgba(237,234,245,0.55)',
    textMuted:    'rgba(237,234,245,0.30)',

    // UI
    border:       'rgba(255,255,255,0.10)',
    divider:      'rgba(255,255,255,0.06)',
    overlay:      'rgba(5,4,9,0.78)',
    accent:       'rgba(255,45,111,0.14)',   // antes bordo — ahora rosa señal

    // Brand
    primary:      '#850021',
    primaryLight: '#FF2D6F',   // antes #C0002F
    signal:       '#FF2D6F',   // NUEVO
    mint:         '#00E5A0',   // NUEVO
  },
  light: {
    bg:           '#F7F5FB',
    bgGlow:       'rgba(255,45,111,0.08)',
    bgGlowFade:   'rgba(255,45,111,0.0)',
    surface:      '#FFFFFF',
    surface2:     '#F0EDF5',
    card:         '#FFFFFF',
    cardBorder:   'rgba(10,9,16,0.08)',

    text:         '#14111C',
    textSub:      'rgba(20,17,28,0.55)',
    textMuted:    'rgba(20,17,28,0.32)',

    border:       'rgba(10,9,16,0.10)',
    divider:      'rgba(10,9,16,0.06)',
    overlay:      'rgba(10,9,16,0.45)',
    accent:       'rgba(255,45,111,0.10)',

    primary:      '#850021',
    primaryLight: '#FF2D6F',
    signal:       '#FF2D6F',
    mint:         '#00E5A0',
  },
} as const;

export type PaletteColors = typeof PALETTE.dark;
