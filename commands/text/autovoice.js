var { checkPerms, saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'autovoice',
	desc: `enables automatic voice channel managment`,
	help:
		"`autovoice <category_id>` - enables automatic management of voice channels in given category\n\n-bot will automatically create and delete voice channels in that category to make sure that there is **exactly one empty voice channel at all times**\n\n-category ID number can be copied using discord's developer mode",
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
