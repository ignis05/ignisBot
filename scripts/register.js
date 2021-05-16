const auth = require('../data/token.json')
const Discord = require('discord.js')
const { exit } = require('process')
const { fetchInteractions } = require('../res/Helpers.js')
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

const interactions = fetchInteractions()

const intents = new Discord.Intents()
const client = new Discord.Client({ intents })

client.once('ready', async () => {
	console.log('Running global command list update'.green)

	let commands = await client.application.commands.fetch()

	for (let cmd of commands.array()) {
		if (!interactions.find(int => int.commandData.name == cmd.name)) {
			console.log(`Found registered command ${cmd.name} with no matching interaction - removing it`.yellow)
			await cmd.delete()
		}
	}

	for (let interaction of interactions) {
		console.log(`Registering command ${interaction.commandData.name}`)
		await client.application.commands.create(interaction.commandData)
	}
	console.log('Global command list update completed'.green)
	exit(0)
})

client.on('error', console.error)
client.login(auth.token)
