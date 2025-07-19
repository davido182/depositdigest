import * as Sentry from "@sentry/react";

// Configuración de Sentry para monitoreo de errores
export const initErrorMonitoring = () => {
  Sentry.init({
    dsn: "https://your-sentry-dsn@sentry.io/project-id", // Configurar con tu DSN real
    environment: process.env.NODE_ENV || "development",
    debug: process.env.NODE_ENV === "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};

// Wrapper para capturar errores personalizados
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("additional_info", context);
    }
    Sentry.captureException(error);
  });
};

// Wrapper para logging personalizado
export const captureMessage = (message: string, level: "info" | "warning" | "error" = "info") => {
  Sentry.captureMessage(message, level);
};

// Configurar usuario para tracking
export const setUser = (user: { id: string; email?: string; role?: string }) => {
  Sentry.setUser(user);
};

// Limpiar datos de usuario
export const clearUser = () => {
  Sentry.setUser(null);
};