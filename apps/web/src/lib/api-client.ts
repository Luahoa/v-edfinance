import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = Cookies.get('refresh_token') || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
      
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const newToken = data.access_token;
            const newRefreshToken = data.refresh_token;

            Cookies.set('token', newToken);
            Cookies.set('refresh_token', newRefreshToken);
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', newToken);
              localStorage.setItem('refresh_token', newRefreshToken);
            }

            isRefreshing = false;
            onRefreshed(newToken);
            
            // Retry the original request
            return request<T>(path, options);
          }
        } catch {
          isRefreshing = false;
          // Handle refresh failure (e.g., logout)
          if (typeof window !== 'undefined') {
            Cookies.remove('token');
            Cookies.remove('refresh_token');
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }
    } else {
      // Wait for refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          resolve(request<T>(path, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            },
          }));
        });
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || response.statusText);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: unknown, options?: RequestInit) => request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, options?: RequestInit) => request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
