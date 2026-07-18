import { AxiosError } from "axios";
import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGE, type ErrorCode } from "./error-messages";

/** Respuesta de error del backend Bosko */
interface BackendErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

export interface ApiError {
  /** Código específico de la regla de negocio (ej: "INVALID_CREDENTIALS") */
  code: string;
  /** Mensaje original del backend (en inglés en producción) */
  serverMessage: string;
  /** Status HTTP */
  statusCode: number;
}

/**
 * Extrae { code, serverMessage, statusCode } del error,
 * sin traducir — la traducción la hace `getUserErrorMessage()`.
 */
export function extractApiError(error: unknown): ApiError {
  if ((error as AxiosError)?.isAxiosError) {
    const axiosError = error as AxiosError<BackendErrorResponse>;
    const data = axiosError.response?.data;

    if (data && typeof data === "object" && "code" in data) {
      return {
        code: data.code,
        serverMessage: data.message || axiosError.message,
        statusCode: data.statusCode || axiosError.response?.status || 500,
      };
    }

    // Error de red o respuesta sin el formato esperado
    return {
      code: "NETWORK_ERROR",
      serverMessage: axiosError.message,
      statusCode: axiosError.response?.status ?? 0,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      serverMessage: error.message,
      statusCode: 0,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    serverMessage: "Ocurrió un error desconocido",
    statusCode: 0,
  };
}

/**
 * Devuelve el mensaje en español listo para mostrar al usuario.
 * Busca el `code` en el mapa de mensajes; si no existe, devuelve un mensaje genérico.
 */
export function getUserErrorMessage(error: unknown): string {
  const { code } = extractApiError(error);
  return ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}
