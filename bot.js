// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { getDirections } = require('./maps');
const { Translator } = require('./translator');
const { extractTranlsatedText } = require('./utils');

// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class MyBot {
    constructor(application, luisPredictionOptions, conversationState, userState, includeApiResults) {
        this.luisRecognizer = new LuisRecognizer(application, luisPredictionOptions, true);
        // Create the state property accessors for the conversation data and user profile.
        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;
    }

    /**
     * Every conversation turn calls this method.
     * @param {TurnContext} turnContext Contains all the data needed for processing the conversation turn.
     */
    async onTurn(turnContext) {
        // By checking the incoming Activity type, the bot only calls LUIS in appropriate cases.
        if (turnContext.activity.type === ActivityTypes.Message) {
            // Perform a call to LUIS to retrieve results for the user's message.
            const results = await this.luisRecognizer.recognize(turnContext);

            // Get the state properties from the turn context.
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationData.get(
                turnContext, {
                    receivedOrigin: false, receivedDest: false, receivedTransport: false, destinationIndex: 0, originIndex: 0, transportIndex: 0, asked: 0
                });

            // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
            const topIntent = results.luisResult.topScoringIntent;
            // Since the LuisRecognizer was configured to include the raw results, get returned entity data.
            var entityData = results.luisResult.entities;

            var translatedResponse;
            if (topIntent.intent !== 'None') {
                if (entityData !== undefined) {
                    // Update all newly recognized info
                    for (let index = 0; index < entityData.length; index++) {
                        switch (entityData[index].type) {
                        case 'Query::Destination':
                            userProfile.dest = entityData[index].entity;
                            conversationData.receivedDest = true;
                            //translatedResponse = await Translator.translate(
                            //    `destination is : ${ entityData[index].entity }`,
                            //    turnContext.activity.detectedLanguage);
                            //await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                            break;
                        case 'Query::Origin':
                            userProfile.origin = entityData[index].entity;
                            conversationData.receivedOrigin = true;
                            //translatedResponse = await Translator.translate(
                            //    `origin is : ${ entityData[index].entity }`,
                            //    turnContext.activity.detectedLanguage);
                            //await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                            break;
                        case 'Query::Transport':
                            if (entityData[index].entity === 'bus' ||
                                entityData[index].entity === 'train' ||
                                entityData[index].entity === 'dart' ||
                                entityData[index].entity === 'luas') {
                                userProfile.transport = entityData[index].entity;
                                conversationData.receivedTransport = true;
                                //translatedResponse = await Translator.translate(
                                //    `transport is : ${ entityData[index].entity }`,
                                //    turnContext.activity.detectedLanguage);
                                //await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                            } else {
                                translatedResponse = await Translator.translate(
                                    `I can't offer information for that mode of transport.`,
                                    turnContext.activity.detectedLanguage);
                                await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                            }
                            break;
                        default:
                        // debug for when luis model recognizes an entity not in this list, which shouldn't happen
                            translatedResponse = await Translator.translate(
                                `whats happening? : ${ entityData[index].type }`,
                                turnContext.activity.detectedLanguage);
                            await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                            break;
                        }
                    }
                }

                // Save user state and save changes.
                await this.userProfile.set(turnContext, userProfile);
                await this.userState.saveChanges(turnContext);
                if ((!conversationData.receivedDest && conversationData.destinationIndex >= 3) ||
                    (!conversationData.receivedOrigin && conversationData.transportIndex >= 3) ||
                    (!conversationData.receivedTransport && conversationData.originIndex >= 3)) { //   Failure
                    const translatedResponse = await Translator.translate(
                        `Sorry. I couldn't understand you. Could you rephrase the whole query?`,
                        turnContext.activity.detectedLanguage);
                    await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    conversationData.receivedDest = false;
                    conversationData.receivedOrigin = false;
                    conversationData.receivedTransport = false;
                    conversationData.transportIndex = 0;
                    conversationData.destinationIndex = 0;
                    conversationData.originIndex = 0;
                } else if (!conversationData.receivedDest) {
                    // increment index when asked for destination
                    if (conversationData.destinationIndex < 1) {
                        translatedResponse = await Translator.translate(
                            'What is your destination',
                            turnContext.activity.detectedLanguage);
                            conversationData.asked = 1;
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    } else {
                        translatedResponse = await Translator.translate(
                            `Sorry. I couldn't get your destination. Could you rephrase it?`,
                            turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    }
                    conversationData.destinationIndex++;
                } else if (!conversationData.receivedOrigin) {
                    // increment index when asked for origin
                    if (conversationData.originIndex < 1) {
                        translatedResponse = await Translator.translate(
                            `What is your origin?`,
                            turnContext.activity.detectedLanguage);
                            conversationData.asked = 1;
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    } else {
                        translatedResponse = await Translator.translate(
                            `Sorry. I couldn't get your origin. Could you rephrase it?`,
                            turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    }
                    conversationData.originIndex++;
                } else if (!conversationData.receivedTransport) {
                    // increment index when asked for transport
                    if (conversationData.transportIndex < 1) {
                        translatedResponse = await Translator.translate(
                            `What mode of transport would you like to take?`,
                            turnContext.activity.detectedLanguage);
                            conversationData.asked = 1;
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    } else {
                        translatedResponse = await Translator.translate(
                            `Sorry. I couldn't get your mode of transport. Could you rephrase it?`,
                            turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    }
                    conversationData.transportIndex++;
                } else { //   Success, i.e., has origin, destination and tranportType
                    // This is where we need to send maps query and return result to user
                    translatedResponse = await Translator.translate(
                        `Looking up directions from ${ userProfile.origin } to ${ userProfile.dest } by ${ userProfile.transport } `,
                        turnContext.activity.detectedLanguage);
                    await turnContext.sendActivity(extractTranlsatedText(translatedResponse));

                    await turnContext.sendActivity(await getDirections(userProfile.origin, userProfile.dest, userProfile.transport,
                        turnContext.activity.detectedLanguage));
                    // Reset all flags to allow bot to go through the cycle again
                    conversationData.receivedDest = false;
                    conversationData.receivedOrigin = false;
                    conversationData.receivedTransport = false;
                    conversationData.transportIndex = 0;
                    conversationData.destinationIndex = 0;
                    conversationData.originIndex = 0;
                    //prompts the user for another destination if any
                    translatedResponse = await Translator.translate(
                        `If there is anywhere else you'd like to go, please let me know!`,
                        turnContext.activity.detectedLanguage);
                    await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                }
            } //else { //  intent === 'None'
            //await turnContext.sendActivity(`${ conversationData.asked }`);
                    
            /*if (conversationData.asked === 1) {
                if (conversationData.transportIndex > 0) {
                    translatedResponse = await Translator.translate(
                        `Your form of transport is ${ turnContext.activity.text }, is this correct?`,
                        turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    //await turnContext.sendActivity(`Your form of transport is ${ turnContext.activity.text }, is this correct?`);//    Needs better phrasing
                } else if (conversationData.originIndex > 0) {
                    translatedResponse = await Translator.translate(
                        `Your origin is ${ turnContext.activity.text }, is this correct?`,
                        turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    //await turnContext.sendActivity(`Your origin is ${ turnContext.activity.text }, is this correct?`);//    Needs better phrasing
                } else if (conversationData.destinationIndex > 0) {
                    translatedResponse = await Translator.translate(
                        `Your destination is ${ turnContext.activity.text }, is this correct?`,
                        turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    //await turnContext.sendActivity(`Your destination is ${ turnContext.activity.text }, is this correct?`);//    Needs better phrasing
                } else {
                    translatedResponse = await Translator.translate(
                        `Sorry, I don't understand?`,
                        turnContext.activity.detectedLanguage);
                        await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
                    //await turnContext.sendActivity(`Sorry, I don't understand?`);
                }
                conversationData.asked = 2;
            } else if (conversationData.asked === 2) {
                if (turnContext.activity.text === 'yes') {
                    //await turnContext.sendActivity(`Load value into correct entity`);
                    conversationData.asked = 0;
                    //  Here's where the next question would be asked or the directions given as it is in the 'intent !== 'None'' 
                } else if (turnContext.activity.text === `no`) {
                    await turnContext.sendActivity(`Ask first question again?`);
                }*/
            //} 
            else {
                translatedResponse = await Translator.translate(
                    `Sorry. I didn't understand that. I can only offer Transport information...`,
                    turnContext.activity.detectedLanguage);
                await turnContext.sendActivity(extractTranlsatedText(translatedResponse));
            }
            //}
            // Update conversation state and save changes.
            await this.conversationData.set(turnContext, conversationData);
            await this.conversationState.saveChanges(turnContext);
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate &&
            turnContext.activity.recipient.id !== turnContext.activity.membersAdded[0].id) {
            // If the Activity is a ConversationUpdate, send a greeting message to the user.
            await turnContext.sendActivity(`Hello! Nice to meet you, my name is Pika. 
                                            \n I can help you plan your travel route.
                                            \n You can speak to me in English, Spanish and French. 
                                            \n Where would you like to go today?`);
        } else if (turnContext.activity.type !== ActivityTypes.ConversationUpdate) {
            // Respond to all other Activity types.
            await turnContext.sendActivity(`[${ turnContext.activity.type }]-type activity detected.`);
        }
    }

    async translateAndExtract(turnContext, text) {
        const translatedResponse = await Translator.translate(text, turnContext.activity.detectedLanguage);
        return extractTranlsatedText(translatedResponse);
    }
}
module.exports.MyBot = MyBot;
