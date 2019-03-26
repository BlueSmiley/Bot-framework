// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { getDirections } = require('./maps');

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
                    receivedOrigin: false, receivedDest: false, receivedTransport: false, destinationIndex: 0, originIndex: 0, transportIndex: 0
                });

            // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
            const topIntent = results.luisResult.topScoringIntent;
            // Since the LuisRecognizer was configured to include the raw results, get returned entity data.
            var entityData = results.luisResult.entities;

            if (topIntent.intent !== 'None') {
                /*
                await turnContext.sendActivity(`LUIS Top Scoring Intent: ${ topIntent.intent }, Score: ${ topIntent.score }`);
                for (let index = 0; index < entityData.length; index++) {
                    await turnContext.sendActivity(`LUIS Entity Found: Entity: ${ entityData[index].entity },
                    Score: ${ entityData[index].score }, Entity Type ${ entityData[index].type }.`);
                }
                */
                if (entityData !== undefined) {
                    // Update all newly recognized info
                    for (let index = 0; index < entityData.length; index++) {
                        switch (entityData[index].type) {
                        case 'Query::Destination':
                            userProfile.dest = entityData[index].entity;
                            conversationData.receivedDest = true;
                            await turnContext.sendActivity(`destination is : ${ entityData[index].entity }`);
                            break;
                        case 'Query::Origin':
                            userProfile.origin = entityData[index].entity;
                            conversationData.receivedOrigin = true;
                            await turnContext.sendActivity(`origin is : ${ entityData[index].entity }`);
                            break;
                        case 'Query::Transport':
                            if (entityData[index].entity === 'bus' ||
                                entityData[index].entity === 'train' ||
                                entityData[index].entity === 'dart' ||
                                entityData[index].entity === 'luas') {
                                userProfile.transport = entityData[index].entity;
                                conversationData.receivedTransport = true;
                                await turnContext.sendActivity(`transport is : ${ entityData[index].entity }`);
                            } else {
                                await turnContext.sendActivity(`I can't offer information for that mode of transport.`);
                            }
                            break;
                        default:
                            await turnContext.sendActivity(`whats happening? : ${ entityData[index].type }`);
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
                    await turnContext.sendActivity(`Sorry. I couldn't understand you. Could you rephrase the whole query?`);
                    conversationData.receivedDest = false;
                    conversationData.receivedOrigin = false;
                    conversationData.receivedTransport = false;
                    conversationData.transportIndex = 0;
                    conversationData.destinationIndex = 0;
                    conversationData.originIndex = 0;
                } else if (!conversationData.receivedDest) {
                    // increment index when asked for destination
                    if (conversationData.destinationIndex < 1) {
                        await turnContext.sendActivity(`What is your destination?`);
                    } else {
                        await turnContext.sendActivity(`Sorry. I couldn't get your destination. Could you rephrase it?`);
                    }
                    conversationData.destinationIndex++;
                } else if (!conversationData.receivedOrigin) {
                    // increment index when asked for origin  
                    if (conversationData.originIndex < 1) {
                        await turnContext.sendActivity(`What is your origin?`);
                    } else {
                        await turnContext.sendActivity(`Sorry. I couldn't get your origin. Could you rephrase it?`);
                    }
                    conversationData.originIndex++;
                } else if (!conversationData.receivedTransport) {
                    // increment index when asked for transport
                    if (conversationData.transportIndex < 1) {
                        await turnContext.sendActivity(`What mode of transport would you like to take?`);
                    } else {
                        await turnContext.sendActivity(`Sorry. I couldn't get your mode of transport. Could you rephrase it?`);
                    }
                    conversationData.transportIndex++;
                } else { //   Success, i.e., has origin, destination and tranportType
                    // This is where we need to send maps query and return result to user
                    await turnContext.sendActivity(`So you want to go from : ${ userProfile.origin } to
                            ${ userProfile.dest } by ${ userProfile.transport } correct?`);
                    await turnContext.sendActivity(await getDirections(userProfile.origin, userProfile.dest, userProfile.transport, 'en'));
                    // Reset all flags to allow bot to go through the cycle again
                    conversationData.receivedDest = false;
                    conversationData.receivedOrigin = false;
                    conversationData.receivedTransport = false;
                    conversationData.transportIndex = 0;
                    conversationData.destinationIndex = 0;
                    conversationData.originIndex = 0;

                    await turnContext.sendActivity(`Is there anywhere else you would like to go?`);
                }
            } else { //  intent === 'None'
                await turnContext.sendActivity(`Sorry. I didn't understand that. I can only offer Transport information...`);
            }
            // Update conversation state and save changes.
            await this.conversationData.set(turnContext, conversationData);
            await this.conversationState.saveChanges(turnContext);
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate &&
            turnContext.activity.recipient.id !== turnContext.activity.membersAdded[0].id) {
            // If the Activity is a ConversationUpdate, send a greeting message to the user.
            await turnContext.sendActivity(`Hello! Nice to meet you, my name is Pika. 
                                            \n I can help you plan your travel route.
                                            \n If you could tell me where you are and where
                                            \n you would like to go. E.g "Bring me from 
                                            \n Trinity to RDS" 
                                            \n Where would you like to go today?`);
        } else if (turnContext.activity.type !== ActivityTypes.ConversationUpdate) {
            // Respond to all other Activity types.
            await turnContext.sendActivity(`[${ turnContext.activity.type }]-type activity detected.`);
        }
    }
}
module.exports.MyBot = MyBot;
