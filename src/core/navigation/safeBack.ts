import type { Href, Router } from 'expo-router';

/**
 * router.back() sin guardia puede terminar en cualquier lado si el stack local
 * se quedó sin historial (deep link, replace previo, remount de tab) — en vez
 * de no-opear cae al navigator raíz y aterriza en la tab por defecto (Dashboard).
 * Siempre usar con un fallback explícito a donde debería volver esa pantalla.
 */
export function safeBack(router: Pick<Router, 'canGoBack' | 'back' | 'replace'>, fallback: Href) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
