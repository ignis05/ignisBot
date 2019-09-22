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
const commands = {}
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

const { checkPerms, saveConfig } = require('./res/Helpers.js')

// #region importing commands
console.log('Loading commands from files:'.accent)
let groups = fs
	.readdirSync('./commands/', { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name)

for (let group of groups) {
	commands[group] = []
}

let multi_cmds = fs
	.readdirSync('./commands/', { withFileTypes: true })
	.filter(dirent => dirent.isFile())
	.map(dirent => dirent.name)
for (let cmd of multi_cmds) {
	try {
		let temp = require(`./commands/${cmd}`)
		// validate module.exports
		if (!temp.name || typeof temp.run != 'function' || temp.categories.length < 1) throw 'wrong arguments'
		// set default properties
		if (!temp.aliases) temp.aliases = []

		for (let group of temp.categories) {
			if (!Object.keys(temp).every(el => ['name', 'aliases', 'run', 'categories'].includes(el))) {
				console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
			} else {
				console.log(`${group}/${temp.name} - loaded`.green)
			}
			commands[group].push(temp)
		}
	} catch (err) {
		console.log(`${cmd} - not loaded, file is invalid`.error)
		console.log(err)
	}
}

for (let group of groups) {
	let files = fs
		.readdirSync(`./commands/${group}`, { withFileTypes: true })
		.filter(dirent => dirent.isFile())
		.map(dirent => dirent.name)
	for (let filename of files) {
		try {
			let temp = require(`./commands/${group}/${filename}`)
			// validate module.exports
			if (!temp.name || typeof temp.run != 'function') throw 'wrong arguments'
			if (!Object.keys(temp).every(el => ['name', 'aliases', 'run'].includes(el))) {
				console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
			} else {
				console.log(`${group}/${temp.name} - loaded`.green)
			}

			// set default properties
			if (!temp.aliases) temp.aliases = []

			commands[group].push(temp)
		} catch (err) {
			console.log(`${filename} - not loaded, file is invalid`.error)
			console.log(err)
		}
	}
}
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
	if (msg.content == '!guild enable' && checkPerms(msg.author.id, 'ignis')) {
		console.log('enabling bot for guild: '.green + msg.guild.id.greenRev)
		config[msg.guild.id] = {
			prefix: '!',
			tempMsgTime: '5000',
			bannedChannels: [],
			perms: {
				admin: [],
				purge: [],
			},
			autoVoice: false,
			autoVoiceFirstChannel: 0,
			random: { min: 1, max: 10 },
		}
		saveConfig(msg.channel, 'guild enabled')
		return
	}
	if (msg.content == '!guild disable' && checkPerms(msg.author.id, 'ignis')) {
		console.log('disabling bot for guild: '.red + msg.guild.id.redRev)
		delete config[msg.guild.id]
		saveConfig(msg.channel, 'guild disabled')
		return
	}
	if (msg.content == '!invite' && checkPerms(msg.author.id, 'ignis')) {
		console.log('sending invite link'.rainbow)
		client
			.generateInvite(['ADMINISTRATOR'])
			.then(link => msg.channel.send(`Generated bot invite link: ${link}`))
			.catch(console.error)
		return
	}
	if (msg.content == '!checkperms' && checkPerms(msg.author.id, 'ignis')) {
		var perms = msg.guild.me.permissions.toArray()
		console.log(perms)
		var desc = ''
		for (let i in perms) {
			desc += `\n- ${perms[i]}`
		}
		const embed = new Discord.RichEmbed()
			.setTitle('My permissions on this guild are:')
			.setColor(0xff0000)
			.setDescription(desc)
		msg.channel.send(embed)
		return
	}
	if (msg.content.startsWith('!echo ') && checkPerms(msg.author.id, 'ignis')) {
		let cnt = msg.content.split(' ')
		cnt.shift()
		cnt = cnt.join(' ')
		msg.channel.send(cnt)
		return
	}
	if (msg.content.toLowerCase().startsWith('!setnickname ') && checkPerms(msg.author.id, 'ignis')) {
		let cnt = msg.content.split(' ')
		cnt.shift()
		cnt = cnt.join(' ')
		msg.guild.me
			.setNickname(cnt)
			.then(() => {
				msg.reply('Done!')
			})
			.catch(() => {
				msg.channel.send('Error - permissions might be insufficient')
			})
		return
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
			msg.channel.send('Command unknown.\nType `help` for help')
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
							channels[0]
								.send('unable to delete voice channel - permissions might be insufficient')
								.then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
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
