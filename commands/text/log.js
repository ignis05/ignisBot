var { saveConfig, config, ignisID } = require('../../res/Helpers.js')
const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'log',
	aliases: ['track'],
	desc: `Selects channels for moderation logs`,
	help:
		'`log list` - shows current log settings\n\n`log <msg / voice / mod>` - enables / disables logs of selected type in current channel\n\nmsg - logs deleted and updated messages\nvoice - logs voice channels activity\nmod - logs guild members joining / leaving / being kicked/banned/unbanned',
	run: async msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR') && msg.author.id != ignisID) {
			msg.reply("You don't have permission to use this command")
			return
		}

		// create config
		if (!config[msg.guild.id].log) {
			config[msg.guild.id].log = { msg: [], voice: [], mod: [] }
			await saveConfig()
		}

		let arg = msg.content.split(' ')[1]
		console.log(arg)
		switch (arg) {
			case 'list':
			case 'settings':
				let log = config[msg.guild.id].log
				if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
					var embed = new RichEmbed()
						.setTitle('**Moderation logs settings:**')
						.setColor(0x00ffff)
						.setDescription(`Which activities are logged to which channels`)
						.addField(
							'Message log:',
							log.msg.length > 0
								? log.msg.map(chID => {
										let channel = msg.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.addField(
							'Voice log:',
							log.voice.length > 0
								? log.voice.map(chID => {
										let channel = voice.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.addField(
							'Moderation log:',
							log.mod.length > 0
								? log.mod.map(chID => {
										let channel = mod.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.setFooter(`Use \`!log [type]\` in specific channel to enable/disable selected type of logs in that channel`)
					msg.channel.send(embed)
				} else {
					msg.channel.send(
						`Turn on embed links permission for better messages\nMessage: ${
							log.msg.length > 0
								? log.msg.map(chID => {
										let channel = msg.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						}\nVoice: ${
							log.voice.length > 0
								? log.voice.map(chID => {
										let channel = voice.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						}\nModeration: ${
							log.mod.length > 0
								? log.mod.map(chID => {
										let channel = mod.channel.guild.channels.get(chID)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						}`
					)
				}
				break
			case 'msg':
			case 'message':
			case 'text':
				let i = config[msg.guild.id].log.msg.indexOf(msg.channel.id)
				// already logging to this channel - disable
				if (i != -1) {
					config[msg.guild.id].log.msg.splice(i, 1)
					msg.channel.send('Disabled msg log in this channel')
				}
				// enable channel
				else {
					config[msg.guild.id].log.msg.push(msg.channel.id)
					msg.channel.send('Enabled msg log in this channel')
				}
				saveConfig()
				break
			default:
				msg.reply('Wrong arguments - use `help log` for help')
		}
	},
}
