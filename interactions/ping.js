module.exports = {
	commandData: {
		name: 'ping',
		description: 'Replies and measures latency',
	},
	run: inter => {
		let lat = Date.now() - inter.createdTimestamp
		console.log('Pong!'.rainbow, lat)
		inter.reply(`Pong! **${lat}ms**`)
	},
}
