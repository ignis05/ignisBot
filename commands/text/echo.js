var { botOwnerID } = require('../../res/Helpers')

module.exports = {
	name: 'echo',
	aliases: ['say', 'repeat'],
	desc: `repeats user's message`,
	help: "`echo <message>` - bot will send a message that is exact copy of user's message except for the `echo` tag",
	run: msg => {
		if (!msg.member.permissions.has('ADMINISTRATOR') && msg.author.id != botOwnerID) {
			msg.reply("You don't have permission to use this command")
			return
		}
		let cnt = msg.content
			.split(' ')
			.filter(arg => arg != '')
			.slice(1)
			.join(' ')
		msg.channel.send(cnt, { disableMentions: 'everyone', allowedMentions: { users: [] } })
	},
}
