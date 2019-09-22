module.exports = {
	name: 'ping',
	categories: ['text', 'dm'],
	run: msg => {
		console.log('Pong!'.rainbow)
		msg.reply('Pong!')
	},
}
