var { saveConfig, config, ignisID } = require('../../res/Helpers.js')
const client = require('../../res/client')

client.on('voiceStateUpdate', (oldState, newState) => {
	if (oldState.channelID && newState.channelID) {
		if (oldState.channelID != newState.channelID) {
			// change
			if (config[newState.guild.id].autoVoice) autovoiceActivity(newState.guild)
		}
	} else if (newState.channelID) {
		//join
		if (config[newState.guild.id].autoVoice) autovoiceActivity(newState.guild)
	} else if (oldState.channelID) {
		//leave
		if (config[newState.guild.id].autoVoice) autovoiceActivity(oldState.guild)
	}
})

async function autovoiceActivity(guild) {
	let categoryChannel = guild.channels.cache.get(config[guild.id].autoVoice)

	if (!categoryChannel.manageable) {
		const defaultChannel = guild.channels.find(channel => channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type == 'text')
		defaultChannel.send(`Unable to manage voice activity - permission 'MANAGE_CHANNEL' might have been revoked\nAutovoice disabled`)
		config[msg.guild.id].autoVoice = false
		saveConfig()
	}
	let catChannels = categoryChannel.children
	let voiceChannels = catChannels.filter(channel => channel.type == 'voice').array()

	let emptyChannels = voiceChannels.filter(channel => channel.members.firstKey() == undefined)
	emptyChannels.reverse()
	let emptycount = emptyChannels.length

	if (emptycount == 0) {
		await guild.channels
			.create((voiceChannels.length + config[guild.id].autoVoiceFirstChannel).toString(), {
				type: 'voice',
				parent: config[guild.id].autoVoice,
				reason: 'autovoice activity',
			})
			.catch(err => {})
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
				channel.delete({ reason: 'autovoice activity' }).catch(err => {})
			}
			// channel full
			else {
				channel.setName(`${index++}`)
			}
		}
	}
}

module.exports = {
	name: 'autovoice',
	desc: `enables automatic voice channel managment`,
	help: "`autovoice <category_id>` - enables automatic management of voice channels in given category\n\n-bot will automatically create and delete voice channels in that category to make sure that there is **exactly one empty voice channel at all times**\n\n-category ID number can be copied using discord's developer mode, if no id is given bot will set up autovoice based on the voicechannel that user is currently in.\nIf command is used without parameter and being in voice channel, autovoice is disabled.\nYou can use `autovoice first <number>` to change number of first autovoice channel",
	run: msg => {
		if (!msg.member.hasPermission('MANAGE_CHANNELS') && msg.author.id != ignisID) {
			msg.reply("You don't have permission to use this command")
			return
		}
		if (isNaN(config[msg.guild.id].autoVoiceFirstChannel)) {
			config[msg.guild.id].autoVoiceFirstChannel = 0
		}

		var command = msg.content.split(' ').filter(arg => arg != '')

		// autovoice first
		if (command[1] === 'first') {
			let nr = command[2]
			if (!isNaN(nr)) {
				config[msg.guild.id].autoVoiceFirstChannel = parseInt(nr)
				saveConfig(msg.channel, `First autovoice channel set to ${nr}`)
				// set names
				var voiceChannels = msg.guild.channels.cache.filter(channel => channel.type == 'voice' && channel.parentID == config[msg.guild.id].autoVoice).array()
				voiceChannels.forEach((channel, iterator) => {
					channel.setName((iterator + parseInt(nr)).toString())
				})
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
				config[msg.guild.id].autoVoice = channel.id
				console.log('autovoice enabled')
				msg.channel.send(`autovoice enabled for category: ${channel.name}`)

				autovoiceActivity(msg.guild)
				let vChannel = channel.children.find(ch => ch.type == 'voice')
				if (vChannel) {
					vChannel.name = config[msg.guild.id].autoVoiceFirstChannel
				}
			} else {
				console.log('wrong channel')
				msg.channel.send("id doesn't belong to category")
			}
		} else {
			config[msg.guild.id].autoVoice = false
			//console.log("autovoice disabled");
			msg.channel.send('autovoice disabled')
		}
		saveConfig()
	},
}
