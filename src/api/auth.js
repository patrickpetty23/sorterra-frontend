import { userPool, getCognitoUser, getAuthDetails, CognitoUserAttribute } from './cognito';
import apiClient from './client';

const decodeJwt = (token) => {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
};

const claimsToUser = (claims) => ({
  sub: claims.sub,
  email: claims.email,
  name: claims.name,
});

export const authApi = {
  async login({ email, password }) {
    return new Promise((resolve, reject) => {
      const cognitoUser = getCognitoUser(email);
      const authDetails = getAuthDetails(email, password);

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().getJwtToken();
          const user = claimsToUser(decodeJwt(idToken));
          apiClient.setToken(idToken);
          apiClient.setUser(user);
          resolve(user);
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Login failed'));
        },
        newPasswordRequired: () => {
          reject(new Error('Password change required. Please contact support.'));
        },
      });
    });
  },

  async register({ name, email, password }) {
    return new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
      ];

      userPool.signUp(email, password, attributes, null, (err, result) => {
        if (err) {
          reject(new Error(err.message || 'Registration failed'));
          return;
        }
        resolve({ cognitoUser: result.user, userSub: result.userSub });
      });
    });
  },

  async confirmRegistration({ email, code }) {
    return new Promise((resolve, reject) => {
      getCognitoUser(email).confirmRegistration(code, true, (err) => {
        if (err) {
          reject(new Error(err.message || 'Confirmation failed'));
          return;
        }
        resolve();
      });
    });
  },

  async resendConfirmationCode({ email }) {
    return new Promise((resolve, reject) => {
      getCognitoUser(email).resendConfirmationCode((err) => {
        if (err) {
          reject(new Error(err.message || 'Failed to resend code'));
          return;
        }
        resolve();
      });
    });
  },

  logout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) cognitoUser.signOut();
    apiClient.clearToken();
    apiClient.clearUser();
  },

  async restoreSession() {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) { resolve(null); return; }

      cognitoUser.getSession((err, session) => {
        if (err || !session?.isValid()) { resolve(null); return; }

        const idToken = session.getIdToken().getJwtToken();
        const user = claimsToUser(decodeJwt(idToken));
        apiClient.setToken(idToken);
        apiClient.setUser(user);
        resolve(user);
      });
    });
  },

  getCurrentUser() {
    return apiClient.getUser();
  },

  isAuthenticated() {
    return !!apiClient.getToken();
  },
};
