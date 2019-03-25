const request = require('request-promise');
const uuidv4 = require('uuid/v4');

const { ActivityTypes } = require('botbuilder');

class Translator {
    static async translate(text, to) {
        const subscriptionKey = process.env.TRANSLATOR_TEXT_KEY;
        const options = {
            method: 'POST',
            baseUrl: 'https://api.cognitive.microsofttranslator.com/',
            url: 'translate',
            qs: {
                'api-version': '3.0',
                to
            },
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            },
            body: [{
                text
            }],
            json: true
        };
        return request(options);
    }

    async onTurn(context, next) {
        // Process translation only if the message type is Message.
        if (context._activity.type === ActivityTypes.Message) {
            const translatedResponse = await Translator.translate(context._activity.text, 'en');
            context._activity.text = translatedResponse[0].translations[0].text;
            await context
                .sendActivity([
                    `Detected language: ${ translatedResponse[0].detectedLanguage.language }`,
                    `Score ${ translatedResponse[0].detectedLanguage.score }`
                ].join(' '));
        }
        await next();
    }
}
module.exports = { Translator };
