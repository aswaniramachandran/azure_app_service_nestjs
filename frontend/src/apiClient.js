export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://aswani-product-api-fghbcjgbf4hyhaa3.indiasouthcentral-01.azurewebsites.net');

let refreshPromise = null;

function clearSession() {
  [
    'access_token',
    'refresh_token',
    'current_user_name',
    'current_user_email',
    'current_user_role',
    'current_user_permissions',
  ].forEach((key) => localStorage.removeItem(key));
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: localStorage.getItem('refresh_token'),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Refresh failed');
        const data = await response.json();
        if (!data?.access_token) throw new Error('Refresh did not return an access token.');
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}, retried = false) {
  const token = localStorage.getItem('access_token');
  const headers =
    options.body instanceof FormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isAuthRoute = path === '/auth/login' || path === '/auth/refresh';

  if (response.status === 401 && !retried && !isAuthRoute) {
    try {
      await refreshAccessToken();
      return apiRequest(path, options, true);
    } catch (error) {
      clearSession();
      window.location.assign('/');
      throw new Error('Your session expired. Please sign in again.', { cause: error });
    }
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = Array.isArray(responseBody?.message)
      ? responseBody.message.join(', ')
      : responseBody?.message || responseBody;
    throw new Error(
      (typeof message === 'string' && message) ||
        `Request failed (${response.status})`,
    );
  }

  return responseBody;
}
