module.exports = {
	name: 'lmgtfy',
	categories: ['text', 'dm'],
	aliases: ['lmgtfu', 'google'],
	desc: 'returns lmgtfy.com link with given query',
	help: '`lmgtfy <query>` - returns lmgtfy.com link to the given query',
	run: msg => {
		let query = encodeURIComponent(
			msg.content
				.split(' ')
				.filter(arg => arg != '')
				.slice(1)
				.join(' ')
		)
		msg.channel.send(`Here's solution for your problem:\n<https://lmgtfy.com/?q=${query}&iie=1>`)
	},
}
