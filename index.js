const prompt = require('prompt');
const axios = require('axios');

prompt.message = 'Slack Transfer';
prompt.delimiter = ' > ';

const SLACK_API_EMOJI_LIST = 'https://slack.com/api/emoji.list';

(async () => {
  prompt.start();

  const { keyFrom, keyTo } = await promiseToGetPrompt([
    {
      properties: {
        keyFrom: {
          description: 'What API do you want to use to transfer from?',
          required: true
        }
      }
    },
    {
      properties: {
        keyTo: {
          description: 'What API do you want to use to transfer to?',
          required: true
        }
      }
    }
  ]);

  const { data: listData = {} } = await axios.get(`${SLACK_API_EMOJI_LIST}?token=${keyFrom}`);
  const { emoji } = listData;
  const emojiKeys = Object.keys(emoji);

  const { shouldPreview } = await promiseToGetPrompt([
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

    const { shouldContinue } = await promiseToGetPrompt([
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

})();

function promiseToGetPrompt(list) {
  const errorBase = 'Failed to get prompt';
  return new Promise((resolve, reject) => {
    if ( !Array.isArray(list) ) {
      reject(`${errorBase}: Invalid list`);
    }
    prompt.get(list, function (err, result) {
      if ( err ) {
        reject(`${errorBase}: ${err}`);
      }
      resolve(result);
    });
  });
}