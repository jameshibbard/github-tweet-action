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

    console.log(tweetTextURL);
    console.log(tweetImageURL);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
