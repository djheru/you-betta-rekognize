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
