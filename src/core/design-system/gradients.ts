import { TOKENS } from './tokens';

// Presets que consolidan los gradientes repetidos a mano en ~45 pantallas.
// No reemplazan los call-sites existentes esta sesión — quedan disponibles
// para adopción incremental.
export const GRADIENTS = {
  // El 2-stop de marca más repetido: [TOKENS.color.primary, TOKENS.color.primaryDark]
  brand: [TOKENS.color.primary, TOKENS.color.primaryDark] as const,

  // 3-stop usado en pantallas de KYC (Intro/Status/Rejected)
  brandDeep: [TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark] as const,

  // Variante "activa" usada en BecomeProviderScreen
  brandActive: [TOKENS.color.primary, '#a0032a', '#c0002f'] as const,

  // Overlays sobre imagen/video (reels, hero)
  overlayFadeDown: ['transparent', 'rgba(0,0,0,0.75)'] as const,
  overlayFadeUp: ['rgba(0,0,0,0.35)', 'transparent'] as const,
} as const;

/**
 * Reemplazo theme-aware del wash claro hardcodeado `['#fdf2f4','#fef7ff','#f0f4ff']`
 * repetido en 8 pantallas (KYC x4, EditProfileScreen, NotificationsScreen,
 * PaymentsScreen, MyReviewsScreen) — ese wash ignora dark mode. Migrar esos
 * call-sites a `GRADIENTS.wash(tc)` es trabajo de la migración incremental,
 * no de esta sesión.
 */
export function wash(tc: { bg: string; surface2: string }): readonly [string, string, string] {
  return [tc.bg, tc.surface2, tc.bg] as const;
}
