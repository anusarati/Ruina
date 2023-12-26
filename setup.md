# Setup instructions

## Proposal Specific
Install [cargo](https://www.rust-lang.org/tools/install), [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/), and [wizer](https://crates.io/crates/wizer/3.0.0) before building ruina-discord-bot.

## General
Activate each language in LoR settings with BaseMod on to get all localization files.

Find the BaseMod folder with the localization files. The path should be similar to "C:\SteamLibrary\steamapps\common\Library Of Ruina\LibraryOfRuina_Data\Managed\BaseMod" on Windows.

Copy the BaseMod folder to ruina-reparser.

Replace the CLIENT_ID value in ruina-cdk/.env with the application id of your [Discord application](https://discord.com/developers/applications).

Configure authentication with AWS CLI.

Run the following commands in the project root:
```sh
npm install --prefix ruina-common
npm run build --prefix ruina-common
npm install --prefix ruina-reparser
npm run build --prefix ruina-reparser
npm install --prefix ruina-discord-bot-onetime-setup
npm run build --prefix ruina-discord-bot-onetime-setup
npm install --prefix ruina-discord-bot
npm run copy:data --prefix ruina-discord-bot
npm run build:full --prefix ruina-discord-bot
npm install --prefix ruina-cdk
npm run build --prefix ruina-cdk
npm run deploy --prefix ruina-cdk
```

Inside ruina-discord-bot-onetime-setup:
Create and fill out a .env file with the following parameters:
```sh
APPLICATION_ID=
BOT_AUTH_TOKEN=
```
Run:
`node ./src/index.js -w`

Create and fill in the JSON for the secrets in AWS Secrets Manager:
```json
{
"applicationId": "",
"authToken": "",
"publicKey": ""
}
```

Use the prod endpoint URL as the interactions endpoint url in your Discord application.

Invite the Discord bot to your server.
