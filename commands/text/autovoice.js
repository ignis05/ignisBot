var { saveConfig, config, botOwnerID } = require('../../res/Helpers.js')
const client = require('../../res/client')

client.on('voiceStateUpdate', (oldState, newState) => {
	if (oldState.channelID && newState.channelID) {
		if (oldState.channelID != newState.channelID) {
			// change
			let guildId = newState.guild.id
			if (config[guildId].autoVoice && config[guildId].autoVoice.categoryID) autovoiceActivity(newState.guild)
		}
	} else if (newState.channelID) {
		//join
		let guildId = newState.guild.id
		if (config[guildId].autoVoice && config[guildId].autoVoice.categoryID) autovoiceActivity(newState.guild)
	} else if (oldState.channelID) {
		//leave
		let guildId = oldState.guild.id
		if (config[guildId].autoVoice && config[guildId].autoVoice.categoryID) autovoiceActivity(oldState.guild)
	}
})

async function autovoiceActivity(guild) {
	let categoryChannel = guild.channels.cache.get(config[guild.id].autoVoice.categoryID)

	if (!categoryChannel || !categoryChannel.manageable || categoryChannel.deleted) {
		const defaultChannel = guild.channels.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type == 'text')
		defaultChannel.send(`Unable to manage voice channels - permission 'MANAGE_CHANNEL' might have been revoked or category has been deleted\nAutovoice disabled`)
		config[guild.id].autoVoice.categoryID = null
		saveConfig()
	}
	let voiceChannels = categoryChannel.children
		.filter(channel => channel.type == 'voice')
		.array()
		.sort((a, b) => a.position - b.position)

	let emptycount = voiceChannels.filter(channel => channel.members.size == 0).length

	if (emptycount == 0) {
		await guild.channels
			.create((voiceChannels.length + config[guild.id].autoVoice.first).toString(), {
				type: 'voice',
				parent: config[guild.id].autoVoice.categoryID,
				reason: 'autovoice activity',
			})
			.catch(err => {})
	} else if (emptycount === 1) {
		let emptyIndex = voiceChannels.findIndex(ch => ch.members.size == 0)
		if (emptyIndex == voiceChannels.length - 1) return // all good
		voiceChannels.push(voiceChannels.splice(emptyIndex, 1)[0])

		let index = 0
		for (let channel of voiceChannels) {
			await channel.setName(`${index + config[guild.id].autoVoice.first}`)
			await channel.setPosition(index)
			index++
		}
	} else if (emptycount > 1) {
		let oneEmptySaved = false
		let index = 0
		for (let channel of voiceChannels) {
			// channel empty
			if (channel.members.size == 0) {
				// leave one empty channel
				if (!oneEmptySaved) {
					oneEmptySaved = true
					await channel.setName(`${index + config[guild.id].autoVoice.first}`)
					await channel.setPosition(index)
					index++
					continue
				}
				await channel.delete({ reason: 'autovoice activity' }).catch(err => {})
			}
			// channel full
			else {
				await channel.setName(`${index + config[guild.id].autoVoice.first}`)
				await channel.setPosition(index)
				index++
			}
		}
		autovoiceActivity(guild)
	}
}

module.exports = {
	name: 'autovoice',
	desc: `enables automatic voice channel managment`,
	help: "`autovoice <category_id>` - enables automatic management of voice channels in given category\n\n-bot will automatically create and delete voice channels in that category to make sure that there is **exactly one empty voice channel at all times**\n\n-category ID number can be copied using discord's developer mode, if no id is given bot will set up autovoice based on the voicechannel that user is currently in.\nIf command is used without parameter and being in voice channel, autovoice is disabled.\nYou can use `autovoice first <number>` to change number of first autovoice channel",
	run: msg => {
		if (!msg.member.hasPermission('MANAGE_CHANNELS') && msg.author.id != botOwnerID) {
			msg.reply("You don't have permission to use this command")
			return
		}
		if (typeof config[msg.guild.id].autoVoice !== 'object') {
			config[msg.guild.id].autoVoice = { categoryID: null, first: 0, emptyFirst: false }
			saveConfig()
		}

		var command = msg.content.split(' ').filter(arg => arg != '')

		// autovoice first
		if (command[1] === 'first') {
			let nr = command[2]
			if (!isNaN(nr)) {
				config[msg.guild.id].autoVoice.first = parseInt(nr)
				saveConfig(msg.channel, `First autovoice channel set to ${nr}`)
				autovoiceActivity(msg.guild)
			} else {
				msg.reply('Given value is NaN')
			}
			return
		}

		var channel = command[1] ? msg.guild.channels.cache.get(command[1]) : (msg.member.voice && msg.member.voice.channel && msg.member.voice.channel.parent) || null
		if (channel) {
			if (channel.type == 'category') {
				if (!channel.permissionsFor(msg.guild.me).has('MANAGE_CHANNELS')) {
					console.log('invalid permissions for autovoice')
					msg.channel.send("I don't have permission 'manage channel' in this category")
					return
				}
				config[msg.guild.id].autoVoice.categoryID = channel.id
				console.log('autovoice enabled')
				msg.channel.send(`autovoice enabled for category: ${channel.name}`)

				autovoiceActivity(msg.guild)
				let vChannel = channel.children.find(ch => ch.type == 'voice')
				if (vChannel) {
					vChannel.name = config[msg.guild.id].autoVoice.first
				}
			} else {
				console.log('wrong channel')
				msg.channel.send("id doesn't belong to category")
			}
		} else {
			config[msg.guild.id].autoVoice.categoryID = null
			//console.log("autovoice disabled");
			msg.channel.send('autovoice disabled')
		}
		saveConfig()
	},
}
