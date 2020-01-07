import { login } from '../services/auth';

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
