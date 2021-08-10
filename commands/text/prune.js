var { botOwnerId } = require('../../res/Helpers')

module.exports = {
	name: 'prune',
	desc: `Removes inactive members without any role`,
	help: "`prune (run | test) <days>` - Basically the same as discord's built in prune, but allows to select a specific number of days between 1 and 30\n(Built in prune only has 3 option: 1, 7 or 30 days)\nUsing with `run` argument will remove members, while `test` will only get number of users that will be kicked, without actually kicking them",
	run: async msg => {
		if (!msg.guild.me.permissions.has('KICK_MEMBERS')) return msg.channel.send("I can't kick members from this guild")
		if (!msg.member.permissions.has('ADMINISTRATOR') && msg.author.id != botOwnerId) return msg.reply("You don't have permission to use this command")

		let args = msg.content
			.split(' ')
			.filter(arg => arg != '')
			.slice(1)

		if (args.length < 2) return msg.channel.send('No arguments - use `!help prune`')
		if (!['run', 'dry', 'test'].includes(args[0])) return msg.channel.send('Invalid argument.')
		let days = parseInt(args[1])
		if (isNaN(days)) return msg.channel.send('Invalid number of days')
		if (days > 30) return msg.channel.send('Days must be less than or equal to 30')

		let removedCount = await msg.guild.members.prune({ dry: args[0] !== 'run', days, reson: `Prune command was used by ${msg.author.tag}` })
		msg.channel.send(`${args[0] !== 'run' ? 'Use again with `run` to remove' : 'Removed'} ${removedCount} members`)
	},
}
