// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const { DialogSet, WaterfallDialog, ChoicePrompt, DialogTurnStatus } =
   require('botbuilder-dialogs');

const DIALOG_STATE_ACCESSOR = 'dialogStateAccessor';
const TRANSPORT_ACCESSOR = 'transportAccessor';

// Define identifiers for our dialogs and prompts.
const TRANSPORT_DIALOG = 'transportDialog';
// const SIZE_RANGE_PROMPT = 'rangePrompt';
const MODE_PROMPT = 'modePrompt';
// const RESERVATION_DATE_PROMPT = 'reservationDatePrompt';

var builder = function() {
    return applyStyle.apply(builder, arguments);
};

// var missing = -1;// 0 - origin, 1 - destination, 2 - mode, 3 - complete
var asked = 0;
// var originDetected = 0;
// var destinationDetected = 0;
// var modeDetected = 0;
var detected = [0, 0, 0];

// const dc = this.dialogSet.createContext(conversationState);
// this.dialogSet = new DialogueSet(this.dialogStateAccessor);

class MyBot {
    constructor(application, luisPredictionOptions, includeApiResults, conversationState) {
        this.luisRecognizer = new LuisRecognizer(application, luisPredictionOptions, true);
        // //conversationState param

        // // Creates our state accessor properties.
        // this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_ACCESSOR);
        // this.transportAccessor = conversationState.createProperty(TRANSPORT_ACCESSOR);
        // this.conversationState = conversationState;

        // // Create the dialog set and add the prompts, including custom validation.
        // this.dialogSet = new DialogSet(this.dialogStateAccessor);
        // this.dialogSet.add(new ChoicePrompt(MODE_PROMPT));

        // // Define the steps of the waterfall dialog and add it to the set.
        // this.dialogSet.add(new WaterfallDialog(TRANSPORT_DIALOG, [
        // this.promptForLocation.bind(this),
        // ]));
    }

    /**
     * Every conversation turn calls this method.
     * @param {TurnContext} turnContext Contains all the data needed for processing the conversation turn.
     */
    async onTurn(turnContext, stepContext) {
        // By checking the incoming Activity type, the bot only calls LUIS in appropriate cases.
        if (turnContext.activity.type === ActivityTypes.Message) {
            // Perform a call to LUIS to retrieve results for the user's message.
            const results = await this.luisRecognizer.recognize(turnContext);

            // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
            const topIntent = results.luisResult.topScoringIntent;
            // Since the LuisRecognizer was configured to include the raw results, get returned entity data.
            var entityData = results.luisResult.entities;
            // var typeList = [`Origin`, `Destination`, `TransportType`];
            // var modeList = ['Bus', 'Luas', 'Walk'];
            // var bus, luas, walk;
            var origin = null;
            var destination = null;
            var mode = null;
            var info = [``, ``, ``];
            // var choiceBus = 0;
            // var choiceLuas = 0;
            // var choiceWalk = 0;

            for (let index = 0; index < entityData.length; index++) { // origin = 0, destination = 1, mode = 2
                if (entityData[index] !== null) {
                    if (entityData[index].type === `Destination`) {
                        info[0] = entityData[index].entity.text;
                        detected[0] = 1;
                        // await turnContext.sendActivity(`destination detected!`);
                    } if (entityData[index].type === `Origin`) {
                        info[1] = entityData[index].entity.text;
                        detected[1] = 1;
                        // await turnContext.sendActivity(`origin detected!`);
                    }
                    if (entityData[index].type === `TransportType`) {
                        info[2] = entityData[index].entity.text;
                        detected[2] = 1;
                        // await turnContext.sendActivity(`mode detected!`);
                    }
                }
                await turnContext.sendActivity(`${ index } ... ${ info[index] } ... ${ entityData[index].entity } ... ${ entityData[index].type }`);
            }
            // if origin, mode or destination have not been detected then they still equal 0 and will ask

            // if(choiceBus === 0 && choiceLuas === 0 && choiceWalk === 0)
            // {
            //   await turnContext.sendActivity('Please choose between bus, luas or walk');
            // }
            // }
            // await turnContext.sendActivity(`${ turnContext.activity.type }`);

            if (topIntent.intent !== 'None') {
                // asked === 0 &&
                await turnContext.sendActivity(`LUIS Top Scoring Intent: ${ topIntent.intent }, Score: ${ topIntent.score }`);
                for (let index = 0; index < entityData.length; index++) {
                    await turnContext.sendActivity(`LUIS Entity Found: Entity: ${ entityData[index].entity }, 
                    Score: ${ entityData[index].score }, Entity Type ${ entityData[index].type }.`);
                }
                if (info[0] === ``) {
                    await turnContext.sendActivity('What is your destination?...');
                } else if (info[1] === ``) {
                    await turnContext.sendActivity('What is your origin?...');
                } else if (info[2] === ``) {
                    // await turnContext.sendActivity('What is your preferred method of transport? (bus, luas, walk)');
                    // for (let index = 0; index < results.luisResult.entities.length; index++) {
                    // if (entityData[index] !== null) {
                    // if (entityData[index].type === `Bus`) {
                    //   bus = entityData[0];
                    // choiceBus = 1;
                    // }
                    // if (entityData[index].type === `Luas`) {
                    //   luas = entityData[1];
                    //  choiceLuas = 1;
                    // }
                    // if (entityData[index].type === `Walk`) {
                    //   walk = entityData[2];
                    //   choiceWalk = 1;
                    // }
                    // }
                    // await turnContext.prompt({
                    // prompt: "What is your preferred method of transport?",
                    // retryPrompt: "Sorry, please choose a method of transport from the list.",
                    // choices: ["Bus", "Luas", "Walk"],
                    // });
                    // promptForLocation(turnContext);
                } else { // all info is filled
                    //  If has origin, destination, mode of transport calls method to query MapsAPI
                    await turnContext.sendActivity(`So... You are at: ${ destination } and want to go to: 
                        ${ origin } by ${ mode }. Is this correct?`); // checks to see that the destination and origin are correct

                    // getDirections(entityData[0].entity, entityData[1].entity, entityData[2].entity);
                }
                asked = 1;
            } else if (asked === 1) {
                //await turnContext.sendActivity(`Found: ${ turnContext.activity.text }`);
                // Assigns most recent answer
                if (info[0] === ``) {
                    info[0] = turnContext.activity.text;
                    await turnContext.sendActivity(`destination found ${ info[0] }`);
                } else if (info[1] === ``) {
                    info[1] = turnContext.activity.text;
                    await turnContext.sendActivity(`origin found`);
                } else if (info[2] === ``) {
                    info[2] = turnContext.activity.text;
                    await turnContext.sendActivity(`mode found`);
                }
                // Checks next empty section of info
                if (info[0] === ``) {
                    await turnContext.sendActivity('What is your destination?');
                } else if (info[1] === ``) {
                    await turnContext.sendActivity('What is your origin?');
                    // } else if (info[2] === null) {
                // await turnContext.sendActivity('What is your preferred method of transport? (bus, luas, walk)');
                // for (let index = 0; index < results.luisResult.entities.length; index++) {
                // if (entityData[index] !== null) {
                // if (entityData[index].type === `Bus`) {
                //   bus = entityData[0];
                // choiceBus = 1;
                // }
                // if (entityData[index].type === `Luas`) {
                //   luas = entityData[1];
                //  choiceLuas = 1;
                // }
                // if (entityData[index].type === `Walk`) {
                //   walk = entityData[2];
                //   choiceWalk = 1;
                // }
                // }
                // await turnContext.prompt({
                // prompt: "What is your preferred method of transport?",
                // retryPrompt: "Sorry, please choose a method of transport from the list.",
                // choices: ["Bus", "Luas", "Walk"],
                // });
                // promptForLocation(turnContext);
                } else { // all info is filled
                //  If has origin, destination, mode of transport calls method to query MapsAPI
                    await turnContext.sendActivity(`So... You are at: ${ destination } and want to go to: 
                        ${ origin }. Is this correct?`); // checks to see that the destination and origin are correct

                // getDirections(entityData[0].entity, entityData[1].entity, entityData[2].entity);
                }
            // } else {
            //     // If the top scoring intent was "None" tell the user no valid intents were found and provide help.
            //         await turnContext.sendActivity(`Sorry, I can only provide information on transportation and traffic`);
            }
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

    // async promptForLocation(stepContext) {
    //     //stepContext.values.size = stepContext.result;

    //     // Prompt for location.
    //     return await stepContext.prompt(LOCATION_PROMPT, {
    //         prompt: 'Please choose a method of transport.',
    //         retryPrompt: 'Sorry, please choose a method of transport from the list.',
    //         choices: ['Bus', 'Luas', 'Walk'],
    //     });
}

module.exports.MyBot = MyBot;