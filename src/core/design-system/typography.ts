// Space Grotesk se carga en app/_layout.tsx (useFonts). Si por algún motivo no
// cargó todavía, RN cae al system font automáticamente — nunca crashea.
export const FONT_FAMILY = {
  heading: 'SpaceGrotesk_700Bold',
  headingSemi: 'SpaceGrotesk_600SemiBold',
  headingMedium: 'SpaceGrotesk_500Medium',
  body: undefined, // system font
} as const;

type TypeStyle = {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
};

// Calibrada contra uso real: grep de fontSize/fontWeight en ~650 sitios de
// src/**/*.tsx (17 jul 2026). Cada preset toma el combo (size,weight) más
// repetido para ese rol — no son valores inventados.
//
//   size  raw   bold(>=600)   rol elegido
//   14    125   22            body      ← tamaño de texto más común de toda la app
//   13    102   14+14         bodySmall / label (13/400 vs 13/600, mismo size distinto peso)
//   12     86   13            caption
//   16     67   27            subtitle / button (16/700 es el combo bold más repetido, 27x)
//   15     65   14            (absorbido por body/label, sin preset propio)
//   18     44   18            title
//   11     44   11            (no tiene preset propio — usar caption con override si hace falta)
//   20     24   13            h3
//   22     21    7            (entre h3 y h2, sin preset propio)
//   24     10    3            h2
//   28     11    2            h1
export const TYPE_SCALE: Record<
  'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'bodySmall' | 'caption' | 'label' | 'button',
  TypeStyle
> = {
  h1:       { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.4, fontFamily: FONT_FAMILY.heading },
  h2:       { fontSize: 24, fontWeight: '800', lineHeight: 30, letterSpacing: -0.3, fontFamily: FONT_FAMILY.heading },
  h3:       { fontSize: 20, fontWeight: '800', lineHeight: 26, fontFamily: FONT_FAMILY.headingSemi },
  title:    { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  subtitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body:     { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall:{ fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption:  { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label:    { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.1 },
  button:   { fontSize: 16, fontWeight: '700', lineHeight: 20 },
};
