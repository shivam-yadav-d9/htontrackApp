import { storage } from '@/utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'karmyogi_access_token';

/** Generate a client-side idempotency key for duplicate-submission prevention. */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await storage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('API REQUEST:', {
    method: (options.method ?? 'GET').toUpperCase(),
    url: `${BASE_URL}${path}`,
    hasToken: Boolean(token),
  });

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  let json: { success: boolean; message: string; data: T | null; errors?: { field: string; message: string }[] };
  try {
    json = await response.json();
  } catch {
    throw new ApiError(response.status, `Server error (${response.status})`);
  }

  if (response.status === 401) {
    // Only clear token for non-auth 401s (i.e., expired sessions, not wrong password on login)
    const isLoginEndpoint = response.url?.includes('/auth/login');
    if (!isLoginEndpoint) {
      await storage.removeItem(TOKEN_KEY);
    }
    throw new ApiError(401, json.message ?? 'Session expired. Please log in again.');
  }

  if (!json.success || json.data === null) {
    throw new ApiError(response.status, json.message ?? 'Request failed', json.errors);
  }

  console.log('API RESPONSE:', { status: response.status, url: path, data: json.data });
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) => {
    if (body instanceof FormData) {
      return request<T>(path, { method: 'POST', body });
    }
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),

  /** Upload a file with real-time progress via XMLHttpRequest. */
  uploadWithProgress: <T>(
    path: string,
    formData: FormData,
    onProgress?: (pct: number) => void,
  ): Promise<T> =>
    new Promise(async (resolve, reject) => {
      const token = await storage.getItem(TOKEN_KEY);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}${path}`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.success && json.data !== null) {
            resolve(json.data as T);
          } else {
            reject(new ApiError(xhr.status, json.message ?? 'Upload failed'));
          }
        } catch {
          reject(new ApiError(xhr.status, `Server error (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));
      xhr.send(formData);
    }),
};
