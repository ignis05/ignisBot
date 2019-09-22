module.exports = {
	name: 'ping',
	categories: ['text', 'dm'],
	run: msg => {
		let lat = Date.now() - msg.createdAt.getTime()
		console.log('Pong!'.rainbow, lat)
		msg.reply(`Pong! *${lat}ms*`)
	},
}
