var { saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'guild',
	run: msg => {
		let arg = msg.content.split(' ')[1]
		if (!arg) {
			msg.channel.send('Invalid argument: use **enable** or **disable**')
			return
		}

		if (arg == 'enable') {
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
		} else {
			console.log('disabling bot for guild: '.red + msg.guild.id.redRev)
			delete config[msg.guild.id]
			saveConfig(msg.channel, 'guild disabled')
		}
	},
}
