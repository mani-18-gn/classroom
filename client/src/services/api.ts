const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('classguard_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('classguard_token', token);
  } else {
    localStorage.removeItem('classguard_token');
  }
};

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
