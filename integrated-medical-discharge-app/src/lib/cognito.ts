import { Amplify } from 'aws-amplify';

// Configure AWS Amplify with Cognito - Updated for final-summary stack
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_uiR5I3Ji2';
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '3al1vtnltnfd8bn1iniaijn3rk';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false, // Updated to match the deployed stack
      },
    },
  },
});

export default Amplify;
