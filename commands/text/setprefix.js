var { saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'setprefix',
	aliases: ['prefix', 'changeprefix'],
	desc: `changes bot prefix on current guild`,
	help: '`setprefix <prefix>` - changes bot prefix on current guild to specified one\n\n`setprefix` - restores default prefix',
	run: msg => {
		var command = msg.content.split(' ')
		if (!msg.member.hasPermission('ADMINISTRATOR') && msg.author.id != '226032144856776704') {
			msg.reply("You don't have permission to use this command")
			return
		}

		let prefix
		if (!command[1]) {
			prefix = '!'
		} else if (command[1].length == 1) {
			prefix = command[1]
		}

		if (prefix) {
			config[msg.guild.id].prefix = prefix
			saveConfig(msg.channel, `Chnaged prefix to: \`${prefix}\``)
		} else {
			msg.channel.send('Invalid character')
		}
	},
}
