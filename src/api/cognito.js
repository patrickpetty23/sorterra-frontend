import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

export const getCognitoUser = (email) =>
  new CognitoUser({ Username: email, Pool: userPool });

export const getAuthDetails = (email, password) =>
  new AuthenticationDetails({ Username: email, Password: password });

export { CognitoUserAttribute };
