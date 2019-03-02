const request = require('request-promise');
const uuidv4 = require('uuid/v4');

const translate = async (text) => {
  const subscriptionKey = process.env.TRANSLATOR_TEXT_KEY;
  const options = {
        method: 'POST',
        baseUrl: 'https://api.cognitive.microsofttranslator.com/',
        url: 'translate',
        qs: {
          'api-version': '3.0',
          'to': 'en'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
              text,
        }],
        json: true,
    };

  return await request(options);
};

module.exports = { translate };
