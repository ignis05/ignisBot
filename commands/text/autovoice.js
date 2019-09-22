var { checkPerms, saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'autovoice',
	run: msg => {
		var command = msg.content.split(' ')
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}
		if (command[1]) {
			if (msg.guild.channels.get(command[1])) {
				if (msg.guild.channels.get(command[1]).type == 'category') {
					config[msg.guild.id].autoVoice = command[1]
					console.log('autovoice enabled')
					msg.channel.send("autovoice enabled - make sure that bot has 'manage channels' permission")
				} else {
					console.log('wrong channel')
					msg.channel.send("id doesn't belong to category")
				}
			} else {
				console.log('wrong id')
				msg.channel.send('wrong id')
			}
		} else {
			config[msg.guild.id].autoVoice = false
			//console.log("autovoice disabled");
			msg.channel.send('autovoice disabled')
		}
		saveConfig()
	},
}
