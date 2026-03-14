/**
 * Base API client configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get auth token from localStorage
   */
  getToken() {
    return localStorage.getItem('sorterra_token');
  }

  /**
   * Set auth token in localStorage
   */
  setToken(token) {
    localStorage.setItem('sorterra_token', token);
  }

  /**
   * Remove auth token from localStorage
   */
  clearToken() {
    localStorage.removeItem('sorterra_token');
  }

  /**
   * Get current user from localStorage
   */
  getUser() {
    const userJson = localStorage.getItem('sorterra_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Set current user in localStorage
   */
  setUser(user) {
    localStorage.setItem('sorterra_user', JSON.stringify(user));
  }

  /**
   * Remove current user from localStorage
   */
  clearUser() {
    localStorage.removeItem('sorterra_user');
  }

  /**
   * Build headers with optional auth token
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Listeners for auth events (401)
   */
  onUnauthorized = null;

  /**
   * User-friendly message for HTTP status codes
   */
  getErrorMessage(status, serverMessage) {
    if (serverMessage) return serverMessage;
    switch (status) {
      case 400: return 'Invalid request. Please check your input and try again.';
      case 401: return 'Your session has expired. Please log in again.';
      case 403: return 'You don\'t have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'This conflicts with an existing resource.';
      case 422: return 'The submitted data is invalid.';
      case 429: return 'Too many requests. Please wait a moment and try again.';
      case 500: return 'An internal server error occurred. Please try again later.';
      case 502: return 'The server is temporarily unavailable. Please try again later.';
      case 503: return 'The service is temporarily unavailable. Please try again later.';
      default: return `An unexpected error occurred (${status}).`;
    }
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.includeAuth !== false),
    };

    try {
      const response = await fetch(url, config);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = this.getErrorMessage(
          response.status,
          errorData?.message || errorData?.title
        );

        // Handle 401 - trigger logout
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }

        throw new ApiError(message, response.status, errorData);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection.',
          0,
          error
        );
      }
      throw new ApiError('An unexpected network error occurred. Please try again.', 0, error);
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode, data) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
