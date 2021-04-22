const Discord = require('discord.js')
const intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED)
intents.add(Discord.Intents.FLAGS.GUILD_MEMBERS)
const client = new Discord.Client({intents})
module.exports = client
