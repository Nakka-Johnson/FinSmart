const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string>;
}

export class HttpError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Inject Authorization token if present
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    // Try to parse JSON
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Backend returns {status, error, message, details?}
      throw new HttpError(
        response.status,
        data?.message || `HTTP ${response.status}`,
        data?.details
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    // Network or parsing errors
    throw new HttpError(0, error instanceof Error ? error.message : 'Network error');
  }
}

export const http = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'POST', body, token }),

  put: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PUT', body, token }),

  patch: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PATCH', body, token }),

  delete: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: 'DELETE', token }),
};
