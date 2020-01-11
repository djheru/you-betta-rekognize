import { deleteWebhook, createWebhook, generateWebhookResponseToken } from '../services/webhook';
import { processTweet } from '../services/twitter';

export const register = async event => {
  console.log(event);
  const result = await createWebhook();
  console.log(result);
  return result
    ? { statusCode: 200, body: JSON.stringify(result, null, '\t') }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to register webook' }),
      };
};

export const validate = async event => {
  console.log(event);
  const { queryStringParameters = {} } = event;
  if (!queryStringParameters) {
    return { statusCode: 200 };
  }
  const { crc_token: crcToken = '' } = queryStringParameters;
  const token = generateWebhookResponseToken(crcToken);
  console.log('Generated Token: %j', token);
  return token
    ? { statusCode: 200, body: token }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to validate webook' }),
      };
};

export const deregister = async event => {
  console.log(event);
  const result = await deleteWebhook();
  return result
    ? { statusCode: 200 }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to deregister webook' }),
      };
};

export const process = async event => {
  const result = await processTweet(event);
  console.log('Result: %j', result);
  return result
    ? { statusCode: 200 }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to process tweet' }),
      };
};
