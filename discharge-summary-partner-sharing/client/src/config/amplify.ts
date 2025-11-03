import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_MRb6l3sZN',
      userPoolClientId: '3p79181msmp4msjbtkkfus89nf',
      region: 'us-east-1',
    }
  }
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;