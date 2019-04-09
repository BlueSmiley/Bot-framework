# my-chat-bot
Demonstrate the core capabilities of the Microsoft Bot Framework

This bot has been created using [Bot Framework][1], it greets the user and allows them to ask for directions to their desired location. The bot detects the origin and destination, then calculates the route and returns this to the user. It is a multilingual bot which detects the user's language and replies to them in that language. If the language is not yet supported by the bot, it will reply to the user with an error message in their chosen language. 

## Prerequisites
- [Node.js][4] version 8.5 or higher
    ```bash
    # determine node version
    node --version
    ```
- [Bot Framework Emulator][6] to test the bot logically
- [LUIS API key][11] to detect the user's origin and destination
- [Maps API key][42] to calculate the correct travel route 
- [Azure Cognitive Services API key][43] to detect language 

# To run the bot

## Setup the environment

Structure of `.env`

```
botFilePath="./my-chat-bot.bot"
botFileSecret=""

TRANSLATOR_TEXT_KEY=<TRANSLATOR_TEXT_API>
MAPS_KEY=<GOOGLE_MAPS_API_KEY>
```

- Install modules
    ```bash
    npm install
    ```
- Start the bot
    ```bash
    npm start
    ```

# Testing the bot using Bot Framework Emulator **v4**
[Bot Framework Emulator][5] is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.2.0 or greater from [here][6]

## Connect to the bot using Bot Framework Emulator **v4**
- Run the program as usual
- Launch Bot Framework Emulator
- File -> Open Bot
- Navigate to `my-chat-bot` folder
- Select `my-chat-bot.bot` file

# Deploy the bot to Azure

## Prerequisites
- [Azure Deployment Prerequisites][41]

## Provision a Bot with Azure Bot Service
After creating the bot and testing it locally, you can deploy it to Azure to make it accessible from anywhere.  To deploy your bot to Azure:

```bash
# login to Azure
az login
```

```bash
# provision Azure Bot Services resources to host your bot
msbot clone services --name "my-chat-bot" --code-dir "." --location <azure region like eastus, westus, westus2 etc.> --sdkLanguage "Node" --folder deploymentScripts/msbotClone --verbose
```

## Publishing Changes to Azure Bot Service
As you make changes to your bot running locally, and want to deploy those change to Azure Bot Service, you can _publish_ those change using either `publish.cmd` if you are on Windows or `./publish` if you are on a non-Windows platform.  The following is an example of publishing

```bash
# run the publish helper (non-Windows) to update Azure Bot Service.  Use publish.cmd if running on Windows
./publish
```

## Getting Additional Help with Deploying to Azure
To learn more about deploying a bot to Azure, see [Deploy your bot to Azure][40] for a complete list of deployment instructions.

# Further reading
- [Bot Framework Documentation][20]
- [Bot Basics][32]
- [Azure Bot Service Introduction][21]
- [Azure Bot Service Documentation][22]
- [Deploy Your Bot to Azure][40]
- [Azure CLI][7]
- [msbot CLI][9]
- [Azure Portal][10]
- [Language Understanding using LUIS][11]
- [Restify][30]
- [dotenv][31]


[1]: https://dev.botframework.com
[2]: https://www.typescriptlang.org
[3]: https://www.typescriptlang.org/#download-links
[4]: https://nodejs.org
[5]: https://github.com/microsoft/botframework-emulator
[6]: https://github.com/Microsoft/BotFramework-Emulator/releases
[7]: https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest
[8]: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest
[9]: https://github.com/Microsoft/botbuilder-tools/tree/master/packages/MSBot
[10]: https://portal.azure.com
[11]: https://www.luis.ai
[20]: https://docs.botframework.com
[21]: https://docs.microsoft.com/en-us/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0
[22]: https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0
[30]: https://www.npmjs.com/package/restify
[31]: https://www.npmjs.com/package/dotenv
[32]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0
[40]: https://aka.ms/azuredeployment
[41]: ./PREREQUISITES.md
[42]: https://developers.google.com/maps/documentation/directions
[43]: https://azure.microsoft.com/en-us/services/cognitive-services/
