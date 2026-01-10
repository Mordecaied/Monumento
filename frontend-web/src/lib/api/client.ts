/**
 * API Client Configuration
 * Handles HTTP requests to the backend with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  const authData = localStorage.getItem('auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { requiresAuth = false, headers = {}, ...restConfig } = config;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError(401, 'No authentication token found');
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restConfig,
      headers: requestHeaders,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : { message: response.statusText };
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || 'Request failed',
        errorData
      );
    }

    // Return parsed JSON or null for empty responses
    if (isJson) {
      return await response.json();
    }

    return null as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error or server is unreachable');
  }
}

/**
 * API client methods
 */
export const apiClient = {
  get: <T>(endpoint: string, requiresAuth = false) =>
    request<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T>(endpoint: string, data?: any, requiresAuth = false) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    }),

  put: <T>(endpoint: string, data?: any, requiresAuth = false) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    }),

  delete: <T>(endpoint: string, requiresAuth = false) =>
    request<T>(endpoint, { method: 'DELETE', requiresAuth }),
};

export { ApiError };
export default apiClient;
