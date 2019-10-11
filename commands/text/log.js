var { saveConfig, config, ignisID } = require('../../res/Helpers.js')

module.exports = {
	name: 'log',
	aliases: ['track'],
	desc: `Selects channels for moderation logs`,
	run: async msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR') && msg.author.id != ignisID) {
			msg.reply("You don't have permission to use this command")
			return
		}

		// create config
		if (!config[msg.guild.id].log) config[msg.guild.id].log = { msg: [], voice: [], mod: [] }
		await saveConfig()

		let arg = msg.content.split(' ')[1]
		console.log(arg)
		switch (arg) {
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
