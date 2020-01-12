import AWS from 'aws-sdk';
import request from 'request-promise';
import { recognizeImage } from './image';

const { BUCKET = '' } = process.env;
const SEPARATOR = '_-_';
const s3 = new AWS.S3();
const TWITTER_STATUS_URL = 'https://api.twitter.com/1.1/statuses/update.json';

const {
  TWITTER_ACCESS_TOKEN = '',
  TWITTER_ACCESS_TOKEN_SECRET = '',
  TWITTER_CONSUMER_API_KEY = '',
  TWITTER_CONSUMER_API_KEY_SECRET = '',
} = process.env;

const oauth = {
  consumer_key: TWITTER_CONSUMER_API_KEY,
  consumer_secret: TWITTER_CONSUMER_API_KEY_SECRET,
  token: TWITTER_ACCESS_TOKEN,
  token_secret: TWITTER_ACCESS_TOKEN_SECRET,
};

const TWEET_CHARACTER_LIMIT = 240;

const parseTweet = tweet => {
  const tweetData = tweet.tweet_create_events;
  if (typeof tweetData === 'undefined' || tweetData.length < 1) {
    console.log('Not a new tweet event', tweetData);
    return false;
  }
  const {
    id_str: tweetId = '',
    user: { id_str: userId = '', screen_name: screenName = '' } = {},
    entities: { media = {} } = {},
  } = tweetData[0];

  if (!media || !media.length) {
    return false;
  }

  const { media_url: mediaUrl = '', type = '' } = media[0];
  console.log('parsed tweet data: %j', { tweetId, userId, screenName, mediaUrl, type });
  return { tweetId, userId, screenName, mediaUrl, type };
};

export const uploadImage = async (imageUrl, meta) => {
  const options = { uri: imageUrl, encoding: null };
  const mediaResponse = await request(options);
  const params = {
    Bucket: meta.bucket,
    Key: meta.key,
    Body: mediaResponse,
  };

  try {
    const uploadedImage = await s3.putObject(params).promise();
    console.log(uploadedImage, 'Image uploaded.');
  } catch (err) {
    console.log('Failure uploading image to S3', err);
  }
};

export const processTweet = async event => {
  try {
    const tweet = JSON.parse(event.body);
    console.log('incoming tweet', tweet);
    const parsedTweet = parseTweet(tweet);
    if (!parsedTweet) {
      return true;
    }
    const { tweetId = '', userId = '', screenName = '', mediaUrl = '', type = '' } = parsedTweet;
    console.log('processTweet: %j', { tweetId, userId, screenName, mediaUrl, type });
    if (!mediaUrl || type !== 'photo') {
      return true; // don't do anything
    }
    const extension = mediaUrl.split('.').pop();
    const key = `${screenName}${SEPARATOR}${tweetId}${SEPARATOR}${Date.now()}.${extension}`;
    console.log('Saving image to s3 bucket at: ', key);
    await uploadImage(mediaUrl, {
      bucket: BUCKET,
      key,
    });
    return true;
  } catch (e) {
    console.log('process tweet err', e);
    return false;
  }
};

const splitTweet = (heading, labelMessage, celebMessage) => {
  const split = `${heading}${labelMessage}${celebMessage}`.split('\n');
  const chunks = [];
  let currentChunk = '';
  for (const chunk of split) {
    if (currentChunk.length + chunk.length > TWEET_CHARACTER_LIMIT) {
      chunks.push(currentChunk);
      currentChunk = chunk;
    } else {
      currentChunk = currentChunk.concat(`\n${chunk}`);
    }
  }
  if (currentChunk !== '') {
    chunks.push(currentChunk);
  }
  return chunks;
};

const createTweet = async (status, tweetId) => {
  const requestOptions = {
    url: TWITTER_STATUS_URL,
    oauth,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    form: {
      status,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true,
    },
    resolveWithFullResponse: true,
  };
  try {
    const response = await request.post(requestOptions);
    console.log('createTweet: %j', response.body);
    return true;
  } catch (e) {
    console.log('create tweet err', e.message);
    return false;
  }
};

export const composeTweet = (username, labels = [], celebrities = []) => {
  let heading = `Hi @${username}, I like your image. \n`;
  let labelMessage = ``;
  let celebMessage = ``;
  if (labels.length + celebrities.length === 0) {
    heading += "I can't recognize anything in the image though...";
  } else {
    if (labels.length) {
      labelMessage += `I recognize some things in this image: ${labels.map(l => l.Name || 'something').join(', ')}\n`;
    }
    if (celebrities.length) {
      const celebFormatter = c => `${c.name} (${c.url}) `;
      celebMessage += `I see some celebs, too: ${celebrities.map(celebFormatter).join('\n')}`;
    }
  }
  return { heading, labelMessage, celebMessage };
};

export const respondToImageTweet = async event => {
  try {
    const { s3 } = event.Records[0];
    const [screenName, tweetId] = s3.object.key.split(SEPARATOR);

    const { labels, celebrities } = await recognizeImage(s3);
    console.log('image contents: %j', { labels, celebrities });

    const { heading, labelMessage, celebMessage } = composeTweet(screenName, labels, celebrities);

    const tweetLength = heading.length + labelMessage.length + celebMessage.length;
    if (tweetLength > TWEET_CHARACTER_LIMIT) {
      const tweetChunks = splitTweet(heading, labelMessage, celebMessage);
      console.log('tweetChunks: %j', tweetChunks);
      const createTweetPromises = tweetChunks.map(chunk => createTweet(chunk, tweetId));
      await Promise.all(createTweetPromises);
    } else {
      const message = `${heading}${labelMessage}${celebMessage}`;
      await createTweet(message, tweetId);
      console.log('respond to image tweet', message);
    }
    return true;
  } catch (e) {
    console.log('respond to tweet err', e.message);
    return false;
  }
};
