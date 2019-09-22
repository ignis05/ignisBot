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
let groups = fs
	.readdirSync('./commands/', { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name)

for (let group of groups) {
	commands[group] = []
	let files = fs
		.readdirSync(`./commands/${group}`, { withFileTypes: true })
		.filter(dirent => dirent.isFile())
		.map(dirent => dirent.name)
	for (let filename of files) {
		try {
			let temp = require(`./commands/${group}/${filename}`)
			// validate module.exports
			if (!temp.name || typeof temp.run != 'function') throw 'wrong arguments'

			// set default properties
			if (!temp.aliases) temp.aliases = []

			commands[group].push(temp)
		} catch (err) {
			console.log(`commands file : ${group}/${filename} is invalid`.error)
			console.log(err)
		}
	}
}
// log:
console.log('Loading commands from files:'.accent)
for (let g of groups) {
	console.log(`${g}:`.success)
	console.log(commands[g].map(cmd => cmd.name))
}
// #endregion importing commands

// #region importing classes
const ResDM = require('./res/ResDM.js')
const ResText = require('./res/ResText.js')
// #endregion importing classes

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
	if (msg.author.bot) return //ignore bots
	if (!msg.guild && msg.channel.id != '551445397411856398') return //ignore priv msgs

	//dont ignore priv msgs from me
	if (msg.channel.id == '551445397411856398') {
		new ResDM(client, msg, commands)
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
			checkVoiceChannels(newMember.voiceChannel.guild)
		}
	} else if (newMember.voiceChannelID) {
		//join
		if (!config[newMember.guild.id].autoVoice) return
		checkVoiceChannels(newMember.voiceChannel.guild)
	} else if (oldMember.voiceChannelID) {
		//leave
		if (!config[newMember.guild.id].autoVoice) return
		checkVoiceChannels(oldMember.voiceChannel.guild)
	}
})

// #region commands

new ResText(commands, 'help', msg => {
	var helpDB = [
		{
			cmd: 'help',
			desc: 'displays this message',
		},
		{
			cmd: 'ping',
			desc: 'replies with pong',
		},
		{
			cmd: 'perms <list / add / del> <mention> <permission>',
			desc: '<list> displays permissions, <add / del> changes permission for mentioned user',
		},
		{
			cmd: 'purge [x]',
			desc: 'deletes x messages from channel (5 by default)',
		},
		{
			cmd: 'blacklist',
			desc: 'adds / removes current channel from blacklist',
		},
		{
			cmd: 'voice <name / url>',
			desc: 'plays sound from predefined source or youtube url',
		},
		{
			cmd: 'autovoice [category id]',
			desc: 'enables auto managment of voice channels in given category (if no id given disables it)',
		},
		{
			cmd: 'autovoicefirst <int>',
			desc: 'changes iteration start point for autovoice channels',
		},
		{
			cmd: 'setprefix <char>',
			desc: 'changes prefix for this guild',
		},
	]
	var specialHelpDB = [
		{
			cmd: 'reload',
			desc: 'reloads config.json file',
		},
		{
			cmd: 'guild <enable / disable>',
			desc: 'enables / disables bot activity on current guild',
		},
		{
			cmd: 'invite',
			desc: 'generates invite',
		},
		{
			cmd: 'checkperms',
			desc: "displays bot's permissions on current guild",
		},
		{
			cmd: 'echo',
			desc: 'bot responds with sending whole message that was after !echo command',
		},
		{
			cmd: '!setnickname [nickname]',
			desc: "sets bot's local nickname on server",
		},
	]

	var desc = `"<required variable>", [optional variable]\n`
	for (let cmd of helpDB) {
		desc += `\n **${cmd.cmd}**\n     - ${cmd.desc}\n`
	}
	if (msg.content.split(' ')[1] == 'debug' || msg.content.split(' ')[1] == 'dev') {
		desc += '\n\n__**debug commands:**__'
		for (let cmd of specialHelpDB) {
			desc += `\n **${cmd.cmd}**\n     - ${cmd.desc}\n`
		}
	}

	const embed = new Discord.RichEmbed()
		.setTitle('Commands list:')
		.setColor(0xff0000)
		.setDescription(desc)
	msg.channel.send(embed)
})

new ResText(commands, 'setrandom', msg => {
	let msg_arr = msg.content.split(' ')
	if (msg_arr.length < 3 || isNaN(msg_arr[1]) || isNaN(msg_arr[2])) {
		msg.reply('Wrong arguments')
		return
	}
	let min = parseInt(msg_arr[1])
	let max = parseInt(msg_arr[2])
	config[msg.guild.id].random = { min: min, max: max }
	saveConfig()
	msg.channel.send(`Random number generator was set to: <${min}, ${max}>`)
})

new ResText(commands, 'random', msg => {
	let min = config[msg.guild.id].random.min
	let max = config[msg.guild.id].random.max
	let rand = Math.floor(Math.random() * (max + 1 - min)) + min
	msg.channel.send(`Your random number <${min}, ${max}>:\n${rand}`)
})
// #endregion

// #region voice functions
function checkVoiceChannels(guild) {
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

// #region interval
var interval = setInterval(() => {
	let date = new Date()
	//    console.log(date.getHours(), date.getMinutes());
	if (date.getHours() == 21 && date.getMinutes() == 37) {
		for (let guildId of Object.keys(config)) {
			if (config[guildId].jp2Channel) {
				var guild = client.guilds.get(guildId)
				if (guild && guild.channels.get(config[guildId].jp2Channel)) {
					guild.channels.get(config[guildId].jp2Channel).send('2137', {
						file: 'https://www.wykop.pl/cdn/c3201142/comment_udrlGttBEvyq9DsF86EsoE2IGbDIx4qq.jpg',
					})
				}
			}
		}
	}
}, 1000 * 60)
// #endregion

// #region github notifier
// function githubNotify(member) {
//     if (member.id == '226032144856776704') {// ignis
//         try {
//             let github = JSON.parse(fs.readFileSync('./data/github_pulls.json'))

//             // console.log(github);
//             let waitingReviews = false
//             //          //webhook-test, cinnamon-game
//             let repos = ['181872271', '179300870']
//             repos.forEach(repo => {
//                 if (github[repo]) {
//                     console.log(github[repo]);
//                     let tabs = Object.values(github[repo])
//                     if (tabs.find(tab => tab.includes('ignis05'))) {
//                         waitingReviews = true
//                     }
//                 }
//             })
//             // console.log('waiting for reviews from ignis: ', waitingReviews);
//             if (waitingReviews) {
//                 console.log('sending notification to '.green + 'ignis'.cyan);
//                 member.send('pull requesty czekają')
//             }
//         }
//         catch (err) { }
//     }

//     if (member.id == '302475226036305931') {// waifu_InMyLaifu
//         try {
//             let github = JSON.parse(fs.readFileSync('./data/github_pulls.json'))

//             // console.log(github);
//             let waitingReviews = false
//             //          //cinnamon-game
//             let repos = ['179300870']
//             repos.forEach(repo => {
//                 if (github[repo]) {
//                     console.log(github[repo]);
//                     let tabs = Object.values(github[repo])
//                     if (tabs.find(tab => tab.includes('koroshiG'))) {
//                         waitingReviews = true
//                     }
//                 }
//             })
//             // console.log('waiting for reviews from waifu_InMyLaifu: ', waitingReviews);
//             if (waitingReviews) {
//                 console.log('sending notification to '.green + 'waifu_InMyLaifu'.cyan);
//                 member.send('pull requesty czekają')
//             }
//         }
//         catch (err) { }
//     }
// }
// #endregion github notifier

client.on('error', console.error)

client.login(token)
