module.exports = {
	name: 'setnickname',
	aliases: ['changenickname'],
	desc: `changes bot nickname on current guild`,
	help: "`setnickname <nickname>` - sets bot' nickname on current guild to specified one\n- if specified nickname is invalid (ex. empty), bot nickname is removed",
	run: msg => {
		if (!msg.member.hasPermission('MANAGE_NICKNAMES')) {
			msg.reply("You don't have permission to use this command")
			return
		}

		if (msg.guild.me.hasPermission('CHANGE_NICKNAME')) {
			let nickname = msg.content
				.split(' ')
				.slice(1)
				.join(' ')

			msg.guild.me.setNickname(nickname).then(() => {
				msg.reply('Done!')
			})
		} else {
			msg.channel.send("I don't have permission 'change nickname' on this guild")
		}
	},
}
