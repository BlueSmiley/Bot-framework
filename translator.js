const request = require('request-promise');
const uuidv4 = require('uuid/v4');

const { ActivityTypes } = require('botbuilder');

class Translator {
    async onTurn(context, next) {
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
                text: context._activity.text
            }],
            json: true
        };

        // Process translation only if the message type is Message.
        if (context._activity.type === ActivityTypes.Message) {
            const trasnlatedResponse = await request(options);
            context._activity.text = trasnlatedResponse[0].translations[0].text;
        }
        await next();
    }
}
module.exports = { Translator };
