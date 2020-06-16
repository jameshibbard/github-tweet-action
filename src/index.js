const Twitter = require('twitter');
const axios = require('axios');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const repoName = github.context.payload.repository.full_name;
    const commitHash = github.context.sha;

    // Get list of files that changed in commit
    const commitURL = `https://api.github.com/repos/${repoName}/commits/${commitHash}`;
    let tweetPath;
    let imagePath;
    const res = await axios.get(commitURL);

    // Expecting commit to contain one MD file and one PNG file.
    res.data.files.forEach((file) => {
      if (file.filename.match(/.*\.md$/)) tweetPath = file.filename;
      if (file.filename.match(/.*\.png$/)) imagePath = file.filename;
    });

    const tweetTextURL = `https://raw.githubusercontent.com/${repoName}/master/${tweetPath}`;
    const tweetImageURL = `https://raw.githubusercontent.com/${repoName}/master/${imagePath}`;

    const client = new Twitter({
      consumer_key: core.getInput('consumer-key'),
      consumer_secret: core.getInput('consumer-secret'),
      access_token_key: core.getInput('access-token'),
      access_token_secret: core.getInput('access-token-secret'),
    });

    // Get Tweet text
    const tweetResponse = await axios.get(tweetTextURL);

    // Get image
    const imageResponse = await axios.get(tweetImageURL, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(imageResponse.data, 'utf-8');

    client.post(
      'media/upload',
      { media: imageData },
      (error, media, response) => {
        if (error) {
          console.log(error);
        } else {
          const status = {
            status: tweetResponse.data,
            media_ids: media.media_id_string,
          };

          client.post(
            'statuses/update',
            status,
            (error, tweet, response) => {
              if (error) {
                console.log(error);
              } else {
                console.log('Tweet was posted!');
              }
            },
          );
        }
      },
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
