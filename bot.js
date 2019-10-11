const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client()
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
	fs.writeFileSync('./data/config.json', '{}')
	config = require('./data/config.json')
}
// #endregion

const { fetchCommands, saveConfig, ignisID } = require('./res/Helpers.js')

// #region importing commands
const commands = fetchCommands()
// #endregion importing commands

client.on('ready', () => {
	client.user.setActivity('anthropomorphized minors', { type: 'WATCHING' })
	console.log("I'm alive!".rainbow)
	console.log('Logged in as ' + client.user.tag.green)
	if (client.user.username == 'ignisBot - debug version') client.user.setActivity('Might be unstable', { type: 'PLAYING' })
	client.fetchUser(ignisID).then(ignis => {
		ignis.send("I'm alive!")
	})
})

client.on('guildCreate', guild => {
	if (guild.available) {
		console.log(`Joined guild ${guild.name} (${guild.id})`.rainbow)
		const defaultChannel = guild.channels.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type == 'text')
		defaultChannel.send('use `!help`')
		client.fetchUser(ignisID).then(ignis => {
			ignis.send(`${ignis} - bot was just activated on new guild ${guild.name}`)
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

	//priv msgs
	if (!msg.guild && commands.dm && commands.dm.length > 0) {
		console.log('recieved command '.blue + msg.content.reverse + ' from '.blue + msg.author.tag.reverse)
		let cont = msg.content.toLowerCase()
		// strip prefixes
		cont = cont.replace(/\W*/, '')
		let command = cont.split(' ')[0]
		let cmd = commands.dm.find(cmd => cmd.name == command || cmd.aliases.includes(command))
		if (cmd) {
			cmd.run(msg)
		} else {
			console.log('Command unknown'.yellow)
			msg.channel.send('Command unknown.\nType `help` for help')
		}
		return
	}

	// if bot is not enabled on this guild
	if (!config[msg.guild.id]) {
		console.log('activating bot for guild: '.green + msg.guild.id.greenRev)
		client.fetchUser(ignisID).then(ignis => {
			ignis.send(`${ignis} - bot was just activated on new guild ${msg.guild.name}`)
		})
		config[msg.guild.id] = configTemplate(msg.guild.name)
		saveConfig()
	}

	// blacklist check (with override for admins)
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id) && (msg.member.hasPermission('ADMINISTRATOR') || msg.author.id == ignisID)) return

	// validate prefix and trigger function
	if (msg.content.charAt(0) == config[msg.guild.id].prefix) {
		// guild permissions check
		if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
			console.log('Failed to send reponse to channel '.red + msg.channel.name.redRev + ' on guild '.red + msg.guild.name.redRev + ' - insuffiecient permissions'.red)
			return
		}

		var command = msg.content.split('')
		command.shift()
		command = command.join('')
		console.log('recieved command '.blue + command.reverse + ' from '.blue + msg.author.tag.reverse)
		command = command.split(' ')[0].toLowerCase()

		let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
		if (cmd) {
			cmd.run(msg)
		} else {
			console.log('Command unknown'.yellow)
			msg.channel.send(`Command unknown.\nType \`${config[msg.guild.id].prefix}help\` for help`)
		}
	}
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (oldMember.voiceChannelID && newMember.voiceChannelID) {
		if (oldMember.voiceChannelID != newMember.voiceChannelID) {
			// change
			if (!config[newMember.guild.id].autoVoice) return
			autovoiceActivity(newMember.guild)
		}
	} else if (newMember.voiceChannelID) {
		//join
		if (!config[newMember.guild.id].autoVoice) return
		autovoiceActivity(newMember.guild)
	} else if (oldMember.voiceChannelID) {
		//leave
		if (!config[newMember.guild.id].autoVoice) return
		autovoiceActivity(oldMember.guild)
	}
})

client.on('messageDelete', msg => {
	console.log('message delete')
	if (!msg.guild) return
	if (!config[msg.guild.id]) return
	if (config[msg.guild.id].log && config[msg.guild.id].log.msg && config[msg.guild.id].log.msg.length > 0) {
		for (channelID of config[msg.guild.id].log.msg) {
			let channel = client.channels.get(channelID)
			if (!channel || !channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
				config[msg.guild.id].log.msg.splice(config[msg.guild.id].log.msg.indexOf(channelID), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
				channel.send(`Turn on embed links permission for better messages\nAuthor: ${msg.author.tag}\nContent: ${msg.cleanContent}`).catch(err => console.error(err))
				continue
			}
			var embed = new Discord.RichEmbed()
				.setTitle('**Message Deleted**')
				.setColor(0xff0000)
				// .setDescription()
				.addField('Author', msg.author.toString(), true)
				.addField('Channel', msg.channel.toString(), true)
				.addField('Created', msg.createdAt.toLocaleString('en-GB'), true)
				.addField('Last edited', msg.editedAt ? msg.editedAt.toLocaleString('en-GB') : 'never', true)
				.addBlankField()
				.addField('Content', msg.content)
				.addBlankField()
				.setFooter(new Date().toLocaleString('en-GB'))
			channel.send(embed).catch(err => console.error(err))
		}
	}
})

// #region voice functions
async function autovoiceActivity(guild) {
	let categoryChannel = guild.channels.get(config[guild.id].autoVoice)

	if (!categoryChannel.permissionsFor(guild.me).has('MANAGE_CHANNELS')) {
		console.log('autovoice perms fail'.red, err)
		const defaultChannel = guild.channels.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type == 'text')
		defaultChannel.send(`Unable to manage voice activity - permission 'MANAGE_CHANNEL' might have been revoked`).then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
	}
	let catChannels = categoryChannel.children
	let voiceChannels = catChannels.filter(channel => channel.type == 'voice').array()

	let emptyChannels = voiceChannels.filter(channel => channel.members.firstKey() == undefined)
	emptyChannels.reverse()
	let emptycount = emptyChannels.length

	if (emptycount == 0) {
		// console.log("there are no empty channels");
		await guild
			.createChannel((voiceChannels.length + config[guild.id].autoVoiceFirstChannel).toString(), {
				type: 'voice',
				parent: config[guild.id].autoVoice,
				reason: 'autovoice activity',
			})
			.catch(err => {
				console.log('channel create fail'.red, err)
			})
	} else if (emptycount > 1) {
		let oneEmptySaved = false
		let index = config[guild.id].autoVoiceFirstChannel
		for (let channel of voiceChannels) {
			// channel empty
			if (channel.members.firstKey() == undefined) {
				// leave one empty channel
				if (!oneEmptySaved) {
					oneEmptySaved = true
					channel.setName(`${index++}`)
					continue
				}
				channel.delete({ reason: 'autovoice activity' }).catch(err => {
					console.log('channel delete fail'.red, err)
				})
			}
			// channel full
			else {
				channel.setName(`${index++}`)
			}
		}
	}
}
// #endregion

// #region functions
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
