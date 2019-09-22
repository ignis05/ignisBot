var { checkPerms, saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'setprefix',
	aliases: ['prefix', 'changeprefix'],
	run: msg => {
		var command = msg.content.split(' ')
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}
		if (command[1].length == 1) {
			config[msg.guild.id].prefix = command[1]
			saveConfig(msg.channel, `Chnaged prefix to: \`${command[1]}\``)
		} else {
			msg.channel.send('Invalid character')
		}
	},
}
