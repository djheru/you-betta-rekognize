import AWS from 'aws-sdk';
import request from 'request-promise';

const { BUCKET = '' } = process.env;
const SEPARATOR = '_-_';
const s3 = new AWS.S3();

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
    console.log('processTweet', { tweetId, userId, screenName, mediaUrl, type });
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
