var { saveConfig, config, botOwnerId } = require('../../res/Helpers.js')
const client = require('../../res/client.js')
const { MessageEmbed } = require('discord.js')

// #region voice log
client.on('voiceStateUpdate', (oldState, newState) => {
	if (!config[newState.guild.id].log || !config[newState.guild.id].log.voice || config[newState.guild.id].log.voice.length < 1) return
	var guild = newState.guild
	var activity = 'unknown'
	var vchannel = 'unknown'
	if (oldState.channelId && newState.channelId && oldState.channelId != newState.channelId) {
		activity = 'switch'
		vchannel = {
			old: oldState.channel,
			new: newState.channel,
		}
	} else if (newState.channelId) {
		activity = 'join'
		vchannel = newState.channel
	} else if (oldState.channelId) {
		activity = 'leave'
		vchannel = oldState.channel
	}
	for (channelId of config[guild.id].log.voice) {
		let channel = client.channels.cache.get(channelId)
		if (!channel || !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
			config[guild.id].log.voice.splice(config[guild.id].log.voice.indexOf(channelId), 1)
			saveConfig()
			continue
		}
		if (!channel.permissionsFor(guild.me).has('EMBED_LINKS')) {
			channel.send(`Turn on embed links permission for better messages\nUser: ${newState.member}\nActivity: ${activity}`).catch(err => console.error(err))
			continue
		}
		var embed = new MessageEmbed()
			.setTitle(`Voice ${activity}`)
			.setColor(0x0000ff)
			// .setDescription()
			.addField('User', newState.member.toString(), true)
			.setTimestamp()
		if (vchannel.old && vchannel.new) {
			embed.addField('Old Channel', vchannel.old.toString(), true).addField('New Channel', vchannel.new.toString(), true)
		} else {
			embed.addField('Channel', vchannel.toString(), true)
		}
		channel.send({ embeds: [embed] }).catch(err => console.error(err))
	}
})
// #endregion voice log

// #region message log
client.on('messageDelete', msg => {
	if (!msg.guild) return
	if (!config[msg.guild.id]) return
	if (config[msg.guild.id].log && config[msg.guild.id].log.msg && config[msg.guild.id].log.msg.length > 0) {
		for (channelId of config[msg.guild.id].log.msg) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
				config[msg.guild.id].log.msg.splice(config[msg.guild.id].log.msg.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
				channel.send(`Turn on embed links permission for better messages\nAuthor: ${msg.author.tag}\nContent: ${msg.cleanContent}`).catch(err => console.error(err))
				continue
			}
			var embed = new MessageEmbed()
				.setTitle('Message Deleted')
				.setColor(0xff0000)
				// .setDescription()
				.addField('Author', msg.author.toString(), true)
				.addField('Channel', msg.channel.toString(), true)
				.addField('Created', msg.createdAt.toLocaleString('en-GB'), true)
				.addField('Last edited', msg.editedAt ? msg.editedAt.toLocaleString('en-GB') : 'never', true)
				.addField('Content', msg.content || '[none]', true)
				.setTimestamp()
			for (let { proxyURL } of msg.attachments.values()) {
				embed.addField('Attachment', proxyURL, true)
			}
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
client.on('messageDeleteBulk', col => {
	col = col.sort((msg1, msg2) => msg1.createdTimestamp > msg2.createdTimestamp)
	var msg = col.first()
	if (!msg.guild) return
	if (!config[msg.guild.id]) return
	if (config[msg.guild.id].log && config[msg.guild.id].log.msg && config[msg.guild.id].log.msg.length > 0) {
		for (channelId of config[msg.guild.id].log.msg) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
				config[msg.guild.id].log.msg.splice(config[msg.guild.id].log.msg.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
				channel.send(`Turn on embed links permission for better messages\nChannel: ${msg.channel.name}\nCount: ${col.size}`).catch(err => console.error(err))
				continue
			}
			var embed = new MessageEmbed().setTitle('Messages Deleted In Bulk').setColor(0xff0000).setDescription(`${col.size} messages were deleted`).setTimestamp()
			if (col.size > 10) {
				embed.addField(`Content can't be shown`, 'Only up to 10 messages can be logged from bulk delete').addField('\u200b', '\u200b')
			} else {
				embed.addField('Channel', msg.channel.toString())
				col.map(msg => embed.addField(`${msg.createdAt.toLocaleString('en-GB') || '<unknown>'}:`, `${msg.author || '<unknown>'} : ${msg.content || '<unknown>'}`))
			}
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
client.on('messageUpdate', (oldmsg, msg) => {
	if (!msg.guild) return
	if (msg.author.bot) return
	if (!config[msg.guild.id]) return
	if (config[msg.guild.id].log && config[msg.guild.id].log.msg && config[msg.guild.id].log.msg.length > 0) {
		for (channelId of config[msg.guild.id].log.msg) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) {
				config[msg.guild.id].log.msg.splice(config[msg.guild.id].log.msg.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
				channel.send(`Turn on embed links permission for better messages\nAuthor: ${msg.author.tag}\nOld Content: ${oldmsg.cleanContent}\n New Content: ${msg.cleanContent}`).catch(err => console.error(err))
				continue
			}
			var embed = new MessageEmbed()
				.setTitle('**Message Updated**')
				.setColor(0x0000ff)
				// .setDescription()
				.addField('Author', msg.author.toString(), true)
				.addField('Channel', msg.channel.toString(), true)
				.addField('Created', msg.createdAt.toLocaleString('en-GB'), true)
				.addField('Old content', oldmsg.content || 'unknown', true)
				.addField('New content', msg.content || 'unknown', true)
				.setTimestamp()
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
// #endregion message log

// #region mod log
client.on('guildMemberAdd', member => {
	const guildId = member.guild.id
	if (!config[guildId]) return
	if (config[guildId].log && config[guildId].log.mod && config[guildId].log.mod.length > 0) {
		for (channelId of config[guildId].log.mod) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(member.guild.me).has('SEND_MESSAGES')) {
				config[guildId].log.mod.splice(config[guildId].log.mod.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(member.guild.me).has('EMBED_LINKS')) {
				channel.send(`${member} has joined!`).catch(err => console.error(err))
				continue
			}
			var embed = new MessageEmbed()
				.setTitle('User joined')
				.setColor(0x00ff00)
				// .setDescription()
				.addField('User', member.toString(), true)
				.addField('Tag', member.user.tag, true)
				.setTimestamp()
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
	// autorole
	if (config[guildId].autorole) {
		member.roles
			.add(config[guildId].autorole)
			.catch(err => console.log(err))
			.then(() => {
				console.log('added autorole')
			})
	}
})
client.on('guildMemberRemove', async member => {
	const guildId = member.guild.id
	if (!config[guildId]) return
	if (config[guildId].log && config[guildId].log.mod && config[guildId].log.mod.length > 0) {
		for (channelId of config[guildId].log.mod) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(member.guild.me).has('SEND_MESSAGES')) {
				config[guildId].log.mod.splice(config[guildId].log.mod.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(member.guild.me).has('EMBED_LINKS')) {
				channel.send(`${member} has left!`).catch(err => console.error(err))
				continue
			}

			const ban_data = await member.guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 }).catch(err => console.log(err))
			if (ban_data && ban_data.entries.first()) {
				const entry = ban_data.entries.first()
				let now = Date.now() - 60000
				if (entry.target.id == member.id && entry.createdTimestamp > now) {
					// relevant ban entry found - ban log will be shown anyway
					console.log('relevant ban entry found')
					return
				}
			}

			var embed = new MessageEmbed()
				.setTitle('User left')
				.setColor(0xff0000)
				// .setDescription()
				.addField('User', member.toString(), true)
				.addField('Tag', member.user.tag, true)
				.setTimestamp()

			const data = await member.guild.fetchAuditLogs({ type: 'MEMBER_KICK', limit: 1 }).catch(err => console.log(err))

			if (data && data.entries.first()) {
				const entry = data.entries.first()
				let now = Date.now() - 60000
				if (entry.target.id == member.id && entry.createdTimestamp > now) {
					// relevant kick entry found
					embed.addField('Executor', entry.executor.toString(), true).addField('Reason', entry.reason, true).setTitle('User was kicked')
				}
			}
			if (!data) {
				embed.addField('Info', 'User might have been kicked, but I need **VIEW_AUDIT_LOG** permission to check that', true)
			}

			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
client.on('guildBanAdd', async (guild, user) => {
	const guildId = guild.id
	if (!config[guildId]) return
	if (config[guildId].log && config[guildId].log.mod && config[guildId].log.mod.length > 0) {
		for (channelId of config[guildId].log.mod) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
				config[guildId].log.mod.splice(config[guildId].log.mod.indexOf(channelId), 1)
				saveConfig()
				continue
			}

			if (!channel.permissionsFor(guild.me).has('EMBED_LINKS')) {
				channel.send(`${user} has been banned`).catch(err => console.error(err))
				continue
			}
			const data = await guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 }).catch(err => console.log(err))

			var embed = new MessageEmbed()
				.setTitle('User banned')
				.setColor(0xff0000)
				// .setDescription()
				.addField('User', user.toString(), true)
				.addField('Tag', user.tag, true)
				.setTimestamp()

			if (!data) {
				embed.addField('Info', '**VIEW_AUDIT_LOG** permission is required to fetch ban details', true)
			} else {
				const entry = data.entries.first()
				let now = Date.now() - 60000
				if (entry && entry.target.id == user.id && entry.createdTimestamp > now) {
					embed.addField('Executor', entry.executor.toString(), true)
					embed.addField('Reason', entry.reason, true)
				} else {
					embed.addField('Info', 'No relevant audit logs were found', true)
				}
			}
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
client.on('guildBanRemove', async (guild, user) => {
	const guildId = guild.id
	if (!config[guildId]) return
	if (config[guildId].log && config[guildId].log.mod && config[guildId].log.mod.length > 0) {
		for (channelId of config[guildId].log.mod) {
			let channel = client.channels.cache.get(channelId)
			if (!channel || !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
				config[guildId].log.mod.splice(config[guildId].log.mod.indexOf(channelId), 1)
				saveConfig()
				continue
			}
			if (!channel.permissionsFor(guild.me).has('EMBED_LINKS')) {
				channel.send(`${user} has been unbanned`).catch(err => console.error(err))
				continue
			}
			const data = await guild.fetchAuditLogs({ type: 'MEMBER_BAN_REMOVE', limit: 1 }).catch(err => console.log(err))

			var embed = new MessageEmbed()
				.setTitle('User unbanned')
				.setColor(0x00ff00)
				// .setDescription()
				.addField('User', user.toString(), true)
				.addField('Tag', user.tag, true)
				.setTimestamp()

			if (!data) {
				embed.addField('Info', '**VIEW_AUDIT_LOG** permission is required to fetch unban details', true)
			} else {
				const entry = data.entries.first()
				let now = Date.now() - 60000
				if (entry && entry.target.id == user.id && entry.createdTimestamp > now) {
					console.log(entry)
					embed.addField('Executor', entry.executor.toString(), true)
				} else {
					embed.addField('Info', 'No relevant audit logs were found', true)
				}
			}
			channel.send({ embeds: [embed] }).catch(err => console.error(err))
		}
	}
})
// #endregion mod log

module.exports = {
	name: 'log',
	aliases: ['track'],
	desc: `Selects channels for moderation logs`,
	help: '`log list` - shows current log settings\n\n`log <msg / voice / mod>` - enables / disables logs of selected type in current channel\n\nmsg - logs deleted and updated messages\nvoice - logs voice channels activity\nmod - logs guild members joining / leaving / being kicked/banned/unbanned',
	run: async msg => {
		if (!msg.member.permissions.has('ADMINISTRATOR') && msg.author.id != botOwnerId) {
			msg.reply("You don't have permission to use this command")
			return
		}

		// create config
		if (!config[msg.guild.id].log) {
			config[msg.guild.id].log = { msg: [], voice: [], mod: [] }
			await saveConfig()
		}

		let arg = msg.content.split(' ').filter(arg => arg != '')[1]
		console.log(arg)
		switch (arg) {
			case 'list':
			case 'settings':
				let log = config[msg.guild.id].log
				if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
					var embed = new MessageEmbed()
						.setTitle('**Moderation logs settings:**')
						.setColor(0x00ffff)
						.setDescription(`Which activities are logged to which channels`)
						.addField(
							'Message log:',
							log.msg.length > 0
								? log.msg.map(chId => {
										let channel = msg.channel.guild.channels.cache.get(chId)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.addField(
							'Voice log:',
							log.voice.length > 0
								? log.voice.map(chId => {
										let channel = msg.channel.guild.channels.cache.get(chId)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.addField(
							'Moderation log:',
							log.mod.length > 0
								? log.mod.map(chId => {
										let channel = msg.channel.guild.channels.cache.get(chId)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						)
						.setFooter(`Use \`!log [type]\` in specific channel to enable/disable selected type of logs in that channel`)
					msg.channel.send({ embeds: [embed] })
				} else {
					msg.channel.send(
						`Turn on embed links permission for better messages\nMessage: ${
							log.msg.length > 0
								? log.msg.map(chId => {
										let channel = msg.channel.guild.channels.cache.get(chId)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						}\nVoice: ${
							log.voice.length > 0
								? log.voice.map(chId => {
										let channel = voice.channel.guild.channels.cache.get(chId)
										return channel ? channel.toString() : 'deleted channel - will be cleared on next attempt to send log'
								  })
								: 'no channels'
						}\nModeration: ${
							log.mod.length > 0
								? log.mod.map(chId => {
										let channel = mod.channel.guild.channels.cache.get(chId)
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
			case 'voice':
				let j = config[msg.guild.id].log.voice.indexOf(msg.channel.id)
				// already logging to this channel - disable
				if (j != -1) {
					config[msg.guild.id].log.voice.splice(j, 1)
					msg.channel.send('Disabled voice log in this channel')
				}
				// enable channel
				else {
					config[msg.guild.id].log.voice.push(msg.channel.id)
					msg.channel.send('Enabled voice log in this channel')
				}
				saveConfig()
				break
			case 'mod':
			case 'moderation':
				let k = config[msg.guild.id].log.mod.indexOf(msg.channel.id)
				// already logging to this channel - disable
				if (k != -1) {
					config[msg.guild.id].log.mod.splice(k, 1)
					msg.channel.send('Disabled mod log in this channel')
				}
				// enable channel
				else {
					config[msg.guild.id].log.mod.push(msg.channel.id)
					msg.channel.send('Enabled mod log in this channel')
				}
				saveConfig()
				break
			default:
				msg.reply('Wrong arguments - use `help log` for help')
		}
	},
}
