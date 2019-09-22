module.exports = {
	name: 'ping',
	run: msg => {
		console.log('Pong!'.rainbow)
		msg.reply('Pong!')
	},
}
