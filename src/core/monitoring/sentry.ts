import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Sin DSN configurado (dev local sin .env, o antes de que se cree el proyecto
// en sentry.io), esto no hace nada — no rompe la app, solo no reporta.
export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) {
    if (__DEV__) console.error('[ErrorBoundary]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
