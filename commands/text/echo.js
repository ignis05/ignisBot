var { checkPerms } = require('../../res/Helpers.js')

module.exports = {
	name: 'echo',
	aliases: ['say', 'repeat'],
	run: msg => {
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) return

		let cnt = msg.content
			.split(' ')
			.slice(1)
			.join(' ')
		msg.channel.send(cnt)
	},
}
