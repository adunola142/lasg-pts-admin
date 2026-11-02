import axios, { AxiosInstance } from 'axios';

/**
 * Thrown whenever a request fails — carries the human-readable `message`
 * the backend's HttpExceptionFilter already produced, so UI code can show
 * it directly. Mirrors lasg_pts_mobile/lib/core/api/api_exception.dart.
 */
export class ApiException extends Error {}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://lasg-pts-backend.onrender.com';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Thin wrapper around axios that matches the backend's response envelope:
 * every response is `{ success, message, data? }` (see
 * src/common/interceptors/transform.interceptor.ts on the backend).
 * Callers get back the raw `data` payload, or an [ApiException] carrying
 * `message` on failure.
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({ baseURL: BASE_URL, timeout: 20000 });
    this.instance.interceptors.request.use((config) => {
      if (authToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    });
  }

  private messageFrom(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data;
      if (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string') {
        return (body as { message: string }).message;
      }
      if (error.code === 'ECONNABORTED') {
        return "Couldn't reach the server — it may still be waking up, try again in a moment.";
      }
      if (!error.response) {
        return 'No connection to the server.';
      }
      return `Request failed (${error.response.status}).`;
    }
    return 'Something went wrong. Please try again.';
  }

  private unwrap<T>(data: unknown): T {
    if (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)) {
      return (data as { data: T }).data;
    }
    return data as T;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.instance.get(path, { params });
      return this.unwrap<T>(res.data);
    } catch (error) {
      throw new ApiException(this.messageFrom(error));
    }
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    try {
      const res = await this.instance.post(path, body);
      return this.unwrap<T>(res.data);
    } catch (error) {
      throw new ApiException(this.messageFrom(error));
    }
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    try {
      const res = await this.instance.patch(path, body);
      return this.unwrap<T>(res.data);
    } catch (error) {
      throw new ApiException(this.messageFrom(error));
    }
  }
}

export const apiClient = new ApiClient();
