import { respondToImageTweet } from '../services/twitter';

export const respond = async event => {
  console.log(event);
  const result = await respondToImageTweet(event);
  return result
    ? { statusCode: 200 }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to respond to tweet' }),
      };
};
