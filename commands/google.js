module.exports = {
	name: 'google',
	categories: ['text', 'dm'],
	aliases: ['lmgtfy'],
	desc: 'teaches people how google works',
	help: '`lmgtfy <query>` - returns letmegooglethat.com link with the given query',
	run: msg => {
		let query = encodeURIComponent(
			msg.content
				.split(' ')
				.filter(arg => arg != '')
				.slice(1)
				.join(' ')
		)
		msg.channel.send(`Here is solution to your problem:\n<http://letmegooglethat.com/?q=${query}>`)
	},
}
