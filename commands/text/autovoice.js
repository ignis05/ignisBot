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
				let categoryChannel = msg.guild.channels.get(command[1])

				if (categoryChannel.type == 'category') {
					if (!categoryChannel.permissionsFor(msg.guild.me).has('MANAGE_CHANNELS')) {
						console.log('invalid permissions for autovoice')
						msg.channel.send("I don't have permission 'manage channel' in this category")
						return
					}
					config[msg.guild.id].autoVoice = command[1]
					console.log('autovoice enabled')
					msg.channel.send(`autovoice enabled for category: ${categoryChannel.name}`)
				} else {
					console.log('wrong channel')
					msg.channel.send("id doesn't belong to category")
				}
			} else {
				console.log('invalid id')
				msg.channel.send('invalid id')
			}
		} else {
			config[msg.guild.id].autoVoice = false
			//console.log("autovoice disabled");
			msg.channel.send('autovoice disabled')
		}
		saveConfig()
	},
}
