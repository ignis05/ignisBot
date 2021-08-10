const auth = require('../data/token.json')
const Discord = require('discord.js')
const { exit } = require('process')
const { testGuildId } = require('../res/Helpers.js')
const colors = require('colors')
colors.setTheme({
	reverse: ['black', 'bgWhite'],
	success: ['green'],
	warn: ['yellow'],
	error: ['red', 'underline'],
	greenRev: ['black', 'bgGreen'],
	redRev: ['black', 'bgRed'],
	accent: ['magenta'],
})

const intents = new Discord.Intents()
const client = new Discord.Client({ intents })

client.once('ready', async () => {
	console.log('Clearing all commands registered on testGuild'.green)
	let testGuild = await client.guilds.fetch(testGuildId)
	let commands = await testGuild.commands.fetch()
	for (let cmd of commands.values()) {
		console.log(`Removing ${cmd.name}`)
		await cmd.delete()
	}
	console.log('TestGuild command list purge completed'.green)
	exit(0)
})

client.on('error', console.error)
client.login(auth.token)
