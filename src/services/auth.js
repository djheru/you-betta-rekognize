import jwt from 'jsonwebtoken';

const { TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, TWITTER_CONSUMER_API_KEY_SECRET } = process.env;

export const login = body => {
  const { token, secret } = body;
  if (token === TWITTER_ACCESS_TOKEN && secret === TWITTER_ACCESS_TOKEN_SECRET) {
    const authToken = jwt.sign({ token }, TWITTER_CONSUMER_API_KEY_SECRET, {
      expiresIn: 86400,
    });
    return authToken;
  }
  return false;
};

export const checkAuthorization = async token => {
  try {
    const decoded = jwt.verify(token, TWITTER_CONSUMER_API_KEY_SECRET);
    if (!decoded) {
      const errMsg = 'Unable to decode token';
      console.log(errMsg);
      throw new Error(errMsg);
    }
    return decoded.token;
  } catch (e) {
    console.log('Error checking token: %j', e);
    throw e;
  }
};

export const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};
