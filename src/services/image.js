import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

const formatCelebrities = celeb => ({
  url: celeb.Urls ? celeb.Urls[0] : 'No URL',
  name: celeb.Name || 'unknown Name',
  id: celeb.Id || 'unknown ID',
});

const getLabels = async (name, key) => {
  try {
    const params = {
      Image: {
        S3Object: {
          Bucket: name,
          Name: key,
        },
      },
      MaxLabels: 15,
      MinConfidence: 25,
    };
    const imageData = await rekognition.detectLabels(params).promise();
    return imageData && imageData.Labels ? imageData.Labels : [];
  } catch (e) {
    console.log('Error getting image labels: ', e);
    throw e;
  }
};

const getCelebrities = async (name, key) => {
  try {
    const params = {
      Image: {
        S3Object: {
          Bucket: name,
          Name: key,
        },
      },
    };
    const celebrityData = await rekognition.recognizeCelebrities(params).promise();
    if (!(celebrityData && celebrityData.CelebrityFaces && celebrityData.CelebrityFaces.length)) {
      return [];
    }
    const celebrities = celebrityData.CelebrityFaces.map(formatCelebrities);
    return celebrities;
  } catch (e) {
    console.log('Error getting image labels: ', e);
    throw e;
  }
};

export const recognizeImage = async meta => {
  try {
    const { bucket: { name = '' } = {}, object: { key = '' } = {} } = meta;
    const labels = await getLabels(name, key);
    console.log('image recognition data: %j', labels);

    const celebrities = await getCelebrities(name, key);
    console.log('celebrity recognition data: %j', celebrities);

    return { labels, celebrities };
  } catch (err) {
    console.log('Cannot recognize image');
    console.log(err);
    return { labels: [], celebrities: [] };
  }
};
