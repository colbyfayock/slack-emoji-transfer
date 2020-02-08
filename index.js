const prompt = require('prompt');
const axios = require('axios');
const FormData = require('form-data');

prompt.message = 'Slack Transfer';
prompt.delimiter = ' > ';

const REQUESTS_PER_BATCH = 20;
const SECONDS_PER_BATCH = 60;

const SLACK_API_EMOJI_LIST = 'https://slack.com/api/emoji.list';
const SLACK_API_EMOJI_ADD = 'https://slack.com/api/emoji.add';

(async () => {
  prompt.start();

  const { tokenFrom, tokenTo } = await getPrompt([
    {
      properties: {
        tokenFrom: {
          description: 'Slack From (Oauth Token)',
          required: true
        }
      }
    },
    {
      properties: {
        tokenTo: {
          description: 'Slack To (User Token)',
          pattern: /^xoxs\-/,
          message: 'Must start with "xoxs-"',
          required: true
        }
      }
    }
  ]);

  const { data: listData = {} } = await axios.get(`${SLACK_API_EMOJI_LIST}?token=${tokenFrom}`);
  const { emoji } = listData;
  const emojiKeys = Object.keys(emoji);

  const emojisToUpload = emojiKeys.map(key => {
    return {
      name: key,
      url: emoji[key]
    }
  });

  const batches = batchItems(emojisToUpload, REQUESTS_PER_BATCH);
  const batchesLength = batches.length;

  console.log(`Batches to process: ${batchesLength}`);
  console.log(`Items per batch: ${REQUESTS_PER_BATCH}`);
  console.log(`Seconds per batch: ${SECONDS_PER_BATCH}`);

  const { shouldPreview } = await getPrompt([
    {
      properties: {
        shouldPreview: {
          description: 'Do you want to preview the list being imported first? y/n',
          default: 'y'
        }
      }
    }
  ]);

  if ( shouldPreview === 'y' ) {
    emojiKeys.forEach(key => console.log(key));

    const { shouldContinue } = await getPrompt([
      {
        properties: {
          shouldContinue: {
            description: 'Do you want to continue? y/n'
          }
        }
      }
    ]);

    if ( shouldContinue === 'n' ) {
      console.log('Exiting...');
      process.exit();
    }
  }

  await Promise.all(batches.map((batch, index) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const all = await addNewEmojis(batch, tokenTo);
        const successes = all.filter(response => !!response.success);
        const failures = all.filter(response => !response.success);

        console.log('Successfully added...');

        successes.forEach(({ name, url}) => console.log(` > ${name} - ${url}`));

        console.log('Failed to be added...');

        failures.forEach(({ name, url, error}) => console.log(` > ${name} - ${url} - ${error.message}`));

        console.log(`Batch ${index + 1} out of ${batchesLength}`)

        if ( index + 1 < batchesLength ) {
          console.log(`Waiting to process next batch (${SECONDS_PER_BATCH}s/batch)...`);
        }

        resolve(all);
      }, SECONDS_PER_BATCH * 1000 * index);
    })
  }))

  console.log('Done.');

})();

/**
 * addNewEmojis
 * @description Adds a list of emojis to a slack workspace
 */

async function addNewEmojis(emojis, token) {
  const promises = emojis.map(async emoji => {
    let response;
    try {
      response = await postNewEmoji({
        ...emoji,
        token
      });
      if ( !response.ok ) throw new Error(response.error);
      return {
        ...emoji,
        success: true
      }
    } catch(e) {
      return {
        ...emoji,
        success: false,
        error: e
      };
    }
  })

  return await Promise.all(promises);
}

/**
 * postNewEmoji
 * @description POST a new emoji to Slack
 */

async function postNewEmoji({ name, url, token }) {
  const errorBase = 'Failed to post new emoji';

  const formData = new FormData();
  let imageBuffer;

  formData.append('name', name);
  formData.append('mode', 'data');

  try {
    imageBuffer = await getImageBuffer(url);
  } catch(e) {
    throw new Error(`${errorBase}: ${e}`);
  }

  formData.append('image', imageBuffer, name);

  try {
    const { data } = await axios({
      method: 'post',
      url: SLACK_API_EMOJI_ADD,
      data: formData.getBuffer(),
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return data;
  } catch(e) {
    throw new Error(`${errorBase}: ${e}`)
  }
}

/**
 * getImageBuffer
 * @description GET an image and return it's Buffer
 */

async function getImageBuffer(url) {
  const errorBase = 'Failed to get image';

  if ( typeof url !== 'string' ) {
    throw new Error(`${errorBase}: Invalid url - ${url}`);
  }

  try {
    const { data: imageData } = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    return imageData;
  } catch(e) {
    throw new Error(`${errorBase}: ${e}`);
  }
}

/**
 * getPrompt
 * @description Promise to get user input given the prompt options
 */

function getPrompt(options) {
  const errorBase = 'Failed to get prompt';
  return new Promise((resolve, reject) => {
    if ( !Array.isArray(options) ) {
      reject(`${errorBase}: Invalid options`);
    }
    prompt.get(options, function (err, result) {
      if ( err ) {
        reject(`${errorBase}: ${err}`);
      }
      resolve(result);
    });
  });
}

/**
 * batchItems
 * @description Splits an array into a group of arrays with a specificied number of items
 */

function batchItems(items, itemsPerBatch) {
  const errorBase = 'Failed to batch items';

  if ( !Array.isArray(items) ) {
    throw new Error(`${errorBase}: invalid items ${items}`);
  }

  const batchCount = Math.ceil(items.length / itemsPerBatch);
  const batches = [];

  for ( let i = 0; i < batchCount; i++ ) {
    const start = i * itemsPerBatch;
    const end = start + itemsPerBatch;
    const batch = items.slice(start, end)
    batches.push(batch);
  }

  return batches;
}