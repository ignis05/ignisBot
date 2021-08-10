const Discord = require('discord.js')
// all intents, channel partial allows to receive dms
const client = new Discord.Client({ intents: [...Object.keys(Discord.Intents.FLAGS)], partials: [{ partials: ['CHANNEL'] }] })
module.exports = client
