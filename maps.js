const mapsAPI = require('@google/maps');
const { Translator } = require('./translator');
const {
    extractTranlsatedText
} = require('./utils');
const removeTags = require('string-strip-html');

const parseDirections = (directions) => {
    return directions.json.routes[0].legs[0].steps.map(d => {
        if (d.steps) {
            return `${ d.html_instructions }\n${ (d.steps
                .map(f => f.html_instructions)).join('\n') }`;
        } else return d.html_instructions;
    }).join(' ');
};

const translateErr = async (language) => {
    const errMsg = 'Sorry I did not understand the locations you specified.';
    const translatedResponse = await Translator.translate(errMsg, language);
    return extractTranlsatedText(translatedResponse);
};

const getDirections = async (origin, destination, mode, language) => {
    const mapsClient = mapsAPI.createClient({
        key: process.env.MAPS_KEY,
        Promise: Promise
    });
    const directionsOptions = {
        origin,
        destination,
        transit_mode: [ mode ],
        language,
        mode: 'transit',
        region: 'ie'
    };

    return mapsClient
        .directions(directionsOptions)
        .asPromise()
        .then(parseDirections)
        .then(removeTags)
        .catch(async () => { return await translateErr(language); });
};
module.exports = { getDirections };
