import apiClient from './client';

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register({ name, email, password }) {
    // Note: Backend uses cognitoSub, but for now we'll use email as placeholder
    // TODO: Implement actual Cognito registration flow
    const userData = {
      cognitoSub: `temp_${Date.now()}`, // Placeholder until Cognito is integrated
      email,
      displayName: name,
    };

    const user = await apiClient.post('/api/users', userData, {
      includeAuth: false, // No auth needed for registration
    });

    // Store user data
    apiClient.setUser(user);

    // TODO: Get actual JWT token from Cognito
    // For now, generate a placeholder token
    const placeholderToken = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    apiClient.setToken(placeholderToken);

    return user;
  },

  /**
   * Login an existing user
   */
  async login({ email, password }) {
    // TODO: Implement actual Cognito authentication
    // For now, we'll just look up the user by email
    
    try {
      // Get all users and find by email (temporary workaround)
      const users = await apiClient.get('/api/users', { includeAuth: false });
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('User not found. Please register first.');
      }

      // Store user data
      apiClient.setUser(user);

      // Generate placeholder token
      const placeholderToken = btoa(JSON.stringify({ userId: user.id, email: user.email }));
      apiClient.setToken(placeholderToken);

      // Update last login time
      await apiClient.put(`/api/users/${user.id}`, {
        lastLoginAt: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      throw new Error('Login failed: ' + error.message);
    }
  },

  /**
   * Logout current user
   */
  logout() {
    apiClient.clearToken();
    apiClient.clearUser();
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return apiClient.getUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!apiClient.getToken();
  },
};
