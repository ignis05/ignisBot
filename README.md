# ignisBot

Discord bot running on node and discord.js<br>

#### Install and lauch:

1. Install packages with `npm i`
2. Start bot with `node bot.js`
3. Default config files will be generated, you will need to paste bot token to `data/token.json` file.
4. Register commands on discord's servers with `npm run register`. It can take up to an hour for discord to fully process registered commands.
5. Start bot again (use `npm run start` to launch it with pm2 process manager). This time it should launch properly.

Make sure to run register script again after making any changes to `commandData` in any of the files inside "interactions" dict. Owner ID and Test Guild ID can be manually changed in `data/owner.json`.

#### Node version:

Bot requires node.js v14.16.1 or newer
