var { saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'autovoicefirst',
	desc: `sets numeration start for autovoice`,
	help: '`autovoicefirst <number>` - changes number of first channel in autovoice category',
	run: msg => {
		if (!msg.member.hasPermission('MANAGE_CHANNELS') && msg.author.id != '226032144856776704') {
			msg.reply("You don't have permission to use this command")
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
