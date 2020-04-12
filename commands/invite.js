module.exports = {
	name: 'invite',
	aliases: ['inv', 'link'],
	categories: ['text', 'dm'],
	desc: 'generates bot invite link',
	help: '`invite` - bot will respond with invite link, that can be used to add bot to another server',
	run: msg => {
		console.log('sending invite link'.success)
		msg.client
			.generateInvite(['ADMINISTRATOR'])
			.then(link => msg.channel.send(`Generated bot invite link: ${link}`))
			.catch(console.error)
	},
}
