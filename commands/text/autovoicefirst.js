var { checkPerms, saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'autovoicefirst',
	run: msg => {
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}

		let nr = parseInt(msg.content.split(' ')[1])
		if (!isNaN(nr)) {
			config[msg.guild.id].autoVoiceFirstChannel = nr
			saveConfig(msg.channel, `First autovoice channel set to ${nr}`)
			var voiceChannels = msg.guild.channels.filter(channel => channel.type == 'voice' && channel.parentID == config[msg.guild.id].autoVoice).array()
			voiceChannels.forEach((channel, iterator) => {
				channel.setName((iterator + config[msg.guild.id].autoVoiceFirstChannel).toString())
			})
		} else {
			msg.reply('Given value is NaN')
		}
	},
}
