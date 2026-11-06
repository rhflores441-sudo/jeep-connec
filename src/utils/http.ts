import { REQUEST_TIMEOUT_MS } from '@/constants/config';

export class ApiError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;

  constructor(message: string, options: { status?: number; code?: string; retryable?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};

function humanizeStatus(status: number): string {
  if (status === 400) return 'La solicitud no es válida.';
  if (status === 401) return 'La sesión expiró o no está autorizada.';
  if (status === 403) return 'El servicio rechazó la solicitud (permisos insuficientes).';
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
  if (status >= 500) return 'El servicio no está disponible en este momento.';
  return `El servicio respondió con un error (${status}).`;
}

/**
 * Fetch JSON con timeout, mensajes de error en español y sin exponer
 * detalles internos de la red al usuario.
 */
export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : null),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        const text = await response.text();
        if (text && text.length < 400) detail = text;
      } catch {
        // Ignorar errores al leer el cuerpo del error.
      }
      throw new ApiError(detail ? `${humanizeStatus(response.status)} ${detail}` : humanizeStatus(response.status), {
        status: response.status,
        code: response.status === 429 ? 'rate_limited' : undefined,
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Verifica tu conexión a Internet.', {
        code: 'timeout',
        retryable: true,
      });
    }
    throw new ApiError('No fue posible conectar con el servicio. Revisa tu conexión a Internet.', {
      code: 'network',
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function errorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
