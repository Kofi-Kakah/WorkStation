import { auth } from '../lib/firebase.js';

const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

/**
 * Thin HTTP client for the Express backend.
 *
 * - Attaches the current Firebase ID token to every request.
 * - Throws on non-2xx responses with a structured error.
 * - Never logs secrets.
 */
class ApiClient {
  constructor() {
    this.base = BASE;
  }

  async request(method, path, body, extraHeaders = {}) {
    const user = auth.currentUser;
    let token = null;
    if (user) {
      try {
        token = await user.getIdToken();
      } catch (error) {
        // Token may be stale; the backend will return 401 and the caller can retry.
        console.warn('Failed to get ID token', error?.message);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = path.startsWith('http') ? path : `${this.base}${path}`;
    const init = { method, headers };

    if (body !== undefined && body !== null) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const res = await fetch(url, init);

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      const error = new Error(data?.error || `HTTP ${res.status}`);
      error.status = res.status;
      error.code = data?.code || 'HTTP_ERROR';
      error.details = data?.details || null;
      throw error;
    }

    return data;
  }

  get(path, body, headers) { return this.request('GET', path, body, headers); }
  post(path, body, headers) { return this.request('POST', path, body, headers); }
  patch(path, body, headers) { return this.request('PATCH', path, body, headers); }
  put(path, body, headers) { return this.request('PUT', path, body, headers); }
  delete(path, body, headers) { return this.request('DELETE', path, body, headers); }
}

export const api = new ApiClient();

export default api;