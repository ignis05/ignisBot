const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs')
const ytdl = require('ytdl-core')
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
// token V
try {
	token = require('./data/token.json').token
} catch (err) {
	let tokenPlaceholder = {
		token: 'bot_token_here',
	}
	fs.writeFileSync('./data/token.json', JSON.stringify(tokenPlaceholder, null, 2))
	throw new Error('Token not found: You need to add bot token in ./data/token.json')
}
// token ^
try {
	config = require('./data/config.json')
} catch (err) {
	fs.writeFile('./data/config.json', JSON.stringify({}, null, 2), err => {
		config = require('./data/config.json')
	})
}
// #endregion

const { fetchCommands, checkPerms, saveConfig } = require('./res/Helpers.js')

// #region importing commands
const commands = fetchCommands()
// #endregion importing commands

client.on('ready', () => {
	client.user.setActivity('anthropomorphized minors', { type: 'WATCHING' })
	console.log("I'm alive!".rainbow)
	console.log('Logged in as ' + client.user.tag.green)
	client.fetchUser('226032144856776704').then(ignis => {
		ignis.send("I'm alive!")
	})
})

client.on('guildCreate', guild => {
	if (guild.available) {
		console.log(`Joined guild ${guild.name} (${guild.id})`.rainbow)
		const defaultChannel = guild.channels.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES'))
		defaultChannel.send('!')
	}
})

client.on('message', msg => {
	//ignore bots
	if (msg.author.bot) return

	//priv msgs
	if (!msg.guild) {
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

	// #region absolute commands
	if (checkPerms(msg.author.id, 'ignis') && msg.content.charAt(0) == '!') {
		var command = msg.content.split('')
		command.shift()
		command = command.join('')
		command = command.split(' ')[0].toLowerCase()

		let cmd = commands.absolute.find(cmd => cmd.name == command || cmd.aliases.includes(command))
		if (cmd) {
			console.log('recieved absolute command '.accent + command.reverse + ' from '.blue + msg.author.tag.reverse)
			cmd.run(msg)
			return
		}
	}
	// #endregion absolute commands

	// if bot is not enabled on this guild
	if (!config[msg.guild.id]) {
		console.log('attempt to use bot on disabled guild')
		msg.reply('Bot activity is disabled on this guild, use `guild enable`')
		return
	}

	// blacklist check (with override for admins)
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id) && !checkPerms(msg.author.id, 'admin', msg.guild.id)) return

	// validate prefix and trigger function
	if (msg.content.charAt(0) == config[msg.guild.id].prefix) {
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
			autovoiceActivity(newMember.voiceChannel.guild)
		}
	} else if (newMember.voiceChannelID) {
		//join
		if (!config[newMember.guild.id].autoVoice) return
		autovoiceActivity(newMember.voiceChannel.guild)
	} else if (oldMember.voiceChannelID) {
		//leave
		if (!config[newMember.guild.id].autoVoice) return
		autovoiceActivity(oldMember.voiceChannel.guild)
	}
})

// #region voice functions
function autovoiceActivity(guild) {
	var voiceChannels = guild.channels.filter(channel => channel.type == 'voice' && channel.parentID == config[guild.id].autoVoice).array()
	// var tab = []
	//var emptycount = 0

	var emptycount = voiceChannels.filter(channel => channel.members.firstKey() == undefined).length
	// console.log(emptycount);
	if (emptycount == 0) {
		// console.log("there are no empty channels");
		guild
			.createChannel((voiceChannels.length + config[guild.id].autoVoiceFirstChannel).toString(), {
				type: 'voice',
				parent: config[guild.id].autoVoice,
				reason: 'autovoice activity',
			})
			.catch(err => {
				// console.log("channel create fail".red);
				var channels = guild.channels.filter(a => a.type == 'text').array()
				channels[0].send('unable to create voice channel - permissions might be insufficient').then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
			})
	} else if (emptycount > 1) {
		// console.log("there are to many empty channels")
		var left = false // skips first mathing empty channel
		let iterator = 0
		voiceChannels.forEach(channel => {
			// console.log(channel.name);
			if (channel.members.firstKey()) {
				// console.log("filled")
				channel.setName((iterator + config[guild.id].autoVoiceFirstChannel).toString())
				iterator++
			} else {
				// console.log("empty")
				if (left) {
					// if one empty is left can delete channels
					channel
						.delete('autovoice activity')
						.then(channel => {})
						.catch(err => {
							console.log('channel delete fail')
							var channels = guild.channels.filter(a => a.type == 'text').array()
							channels[0].send('unable to delete voice channel - permissions might be insufficient').then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
						})
				} else {
					// else saves this one
					left = true
					channel.setName((iterator + config[guild.id].autoVoiceFirstChannel).toString())
					iterator++
				}
			}
		})
	}
}
// #endregion

client.on('error', console.error)

client.login(token)
