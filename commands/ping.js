module.exports = {
	name: 'ping',
	categories: ['text', 'dm'],
	desc: 'causes bot to respond and measure latency',
	help: '`ping` - bot will respond with !Pong followed by time that passed between the moment your message was created to the moment bot processed it',
	run: msg => {
		let lat = Date.now() - msg.createdAt.getTime()
		console.log('Pong!'.rainbow, lat)
		msg.reply(`Pong! *${lat}ms*`)
	},
}
