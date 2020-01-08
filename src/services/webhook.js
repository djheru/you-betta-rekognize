import request from 'request-promise';
import crypto from 'crypto';

const {
  API_GATEWAY_URL = '',
  TWITTER_ACCESS_TOKEN = '',
  TWITTER_ACCESS_TOKEN_SECRET = '',
  TWITTER_CONSUMER_API_KEY = '',
  TWITTER_CONSUMER_API_KEY_SECRET = '',
  TWITTER_DEV_ENV = '',
} = process.env;

const oauth = {
  consumer_key: TWITTER_CONSUMER_API_KEY,
  consumer_secret: TWITTER_CONSUMER_API_KEY_SECRET,
  token: TWITTER_ACCESS_TOKEN,
  token_secret: TWITTER_ACCESS_TOKEN_SECRET,
};

const TWITTER_WEBHOOK_URL = 'https://api.twitter.com/1.1/account_activity/all';

export const generateWebhookResponseToken = crcToken => {
  if (crcToken) {
    const hash = crypto
      .createHmac('sha256', TWITTER_CONSUMER_API_KEY_SECRET)
      .update(crcToken)
      .digest('base64');
    return JSON.stringify({ response_token: `sha256=${hash}` });
  }
  return false;
};

export const getWebhook = async () => {
  const url = `${TWITTER_WEBHOOK_URL}/${TWITTER_DEV_ENV}/webhooks.json`;
  const requestOptions = {
    url,
    oauth,
  };
  try {
    const response = await request.get(requestOptions);
    const responseData = JSON.parse(response);
    if (!responseData.length) {
      console.log('No existing webhook found');
      return false;
    }
    console.log('getWebhook', responseData);
    return responseData[0];
  } catch (e) {
    console.log('getWebhook err', e);
    return false;
  }
};

export const createWebhook = async () => {
  const url = `${TWITTER_WEBHOOK_URL}/${TWITTER_DEV_ENV}/webhooks.json`;
  const processingUrl = `${API_GATEWAY_URL}/webhook/process`;
  const requestOptions = {
    url,
    oauth,
    resolveWithFullResponse: true,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    form: { url: processingUrl },
  };

  try {
    // If webhook is already registered, use it
    const existingWebhook = await getWebhook();
    if (existingWebhook && existingWebhook.url === processingUrl) {
      console.log('existing webhook', existingWebhook);
      return existingWebhook;
    }
    await request.post(requestOptions);
    const webhookResponse = await getWebhook();
    console.log('createWebhook', { webhookResponse });
    return webhookResponse;
  } catch (e) {
    console.log('createWebhook err', e.message || 'Error registering webhook');
    return false;
  }
};

export const deleteWebhook = async () => {
  try {
    const webhookResponse = await getWebhook();
    if (!webhookResponse) {
      // If no webhook exists, we're good
      return true;
    }
    console.log('Existing webhookResponse', webhookResponse);
    const { id: webhookId } = webhookResponse;
    const url = `${TWITTER_WEBHOOK_URL}/${TWITTER_DEV_ENV}/webhooks/${webhookId}.json`;
    const requestOptions = {
      url,
      oauth,
    };
    const response = await request.delete(requestOptions);
    console.log('deleteWebhook', response);
    return true;
  } catch (e) {
    console.log('deleteWebhook err', e);
    return false;
  }
};

export const subscribe = async () => {
  try {
    const webhookResponse = await getWebhook();
    if (!webhookResponse) {
      // Must have a webhook registered
      console.log('No webhook registered');
      return false;
    }

    const requestOptions = {
      url: `${TWITTER_WEBHOOK_URL}/${TWITTER_DEV_ENV}/subscriptions.json`,
      oauth,
      resolveWithFullResponse: true,
    };
    const response = await request.post(requestOptions);
    console.log('subscribe', response);
    return true;
  } catch (e) {
    console.log('subscribe err', e);
    return false;
  }
};

export const unsubscribe = async () => {
  try {
    const webhookResponse = await getWebhook();
    if (!webhookResponse) {
      // If there's no webhook, there can't be a subscription, so we're good
      return true;
    }

    const requestOptions = {
      url: `${TWITTER_WEBHOOK_URL}/${TWITTER_DEV_ENV}/subscriptions.json`,
      oauth,
      resolveWithFullResponse: true,
    };
    const response = await request.delete(requestOptions);
    console.log('unsubscribe', response);
    return true;
  } catch (e) {
    console.log('unsubscribe err', e);
    return false;
  }
};
