// New File: ./src/functions/healthCheck.js

export const handler = async event => {
  console.log('healthCheck: %j', event);
  return { statusCode: 200, body: 'ohai' };
};
