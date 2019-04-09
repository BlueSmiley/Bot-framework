const request = require('request-promise');
const uuidv4 = require('uuid/v4');
const iso2Lang = require('./iso2lang.json');
const {
    extractDetectedLanguage,
    extractDetectedLanguageScore,
    extractTranlsatedText
} = require('./utils');

const { ActivityTypes } = require('botbuilder');

const supportedLanguages = [ 'en', 'es' ];

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
            const detectedLanguage = extractDetectedLanguage(translatedResponse);
            if (supportedLanguages.indexOf(detectedLanguage) === -1) {
                const errMsg = `Sorry ${ iso2Lang[detectedLanguage] || detectedLanguage } is not supported yet.`;
                const errMsgDetectedLanguage = extractTranlsatedText(await Translator.translate(errMsg, detectedLanguage));
                await context.sendActivity(`${ errMsg }\n${ errMsgDetectedLanguage }`);
                return;
            }
            context._activity.detectedLanguageScore = extractDetectedLanguageScore(translatedResponse);
            context._activity.text = extractTranlsatedText(translatedResponse);
            context._activity.detectedLanguage = detectedLanguage;
        }
        await next();
    }
}
module.exports = { Translator };
