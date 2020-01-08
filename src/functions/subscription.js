import { subscribe, unsubscribe } from '../services/webhook';

export const add = async event => {
  console.log(event);
  const result = await subscribe();
  return result
    ? { statusCode: 200 }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to subscribe' }),
      };
};

export const remove = async event => {
  console.log(event);
  const result = await unsubscribe();
  return result
    ? { statusCode: 200 }
    : {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unable to unsubscribe' }),
      };
};
