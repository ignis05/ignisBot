module.exports = {
	name: 'echo',
	aliases: ['say', 'repeat'],
	desc: `repeats user's message`,
	help: "`echo <message>` - bot send message that is exact copy of user's message except for `echo` tag",
	run: msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR')) {
			msg.reply("You don't have permission to use this command")
			return
		}
		let cnt = msg.content
			.split(' ')
			.slice(1)
			.join(' ')
		msg.channel.send(cnt)
	},
}
