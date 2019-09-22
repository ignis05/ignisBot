module.exports = {
	name: 'invite',
	aliases: ['inv', 'link'],
	categories: ['text', 'dm'],
	run: msg => {
		console.log('sending invite link'.success)
		msg.client
			.generateInvite(['ADMINISTRATOR'])
			.then(link => msg.channel.send(`Generated bot invite link: ${link}`))
			.catch(console.error)
	},
}
