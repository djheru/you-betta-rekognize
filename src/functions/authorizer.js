import { checkAuthorization, generatePolicy, login } from '../services/auth';

export const getToken = async event => {
  try {
    const { body, ...rest } = event;
    console.log('JWT requested: %j', rest); // Don't include credentials
    const authToken = login(JSON.parse(body));
    if (!authToken) {
      throw new Error('Login credentials incorrect');
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ authToken }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: `Invalid login: ${e.message}`,
      }),
    };
  }
};

export const authorize = async event => {
  try {
    const tokenParts = event.authorizationToken.split(' ');
    const token = tokenParts[1];
    const twitterToken = await checkAuthorization(token);
    return generatePolicy(twitterToken, 'Allow', event.methodArn);
  } catch (e) {
    console.log('Invalid token in authorizer', e);
    return generatePolicy('', 'Deny', event.methodArn);
  }
};
