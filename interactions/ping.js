module.exports = {
	commandData: {
		name: 'ping',
		description: 'Replies and measures latency',
	},
	run: interaction => {
		let lat = Date.now() - interaction.createdTimestamp
		console.log('Pong!'.rainbow, lat)
		interaction.reply(`Pong! **${lat}ms**`)
	},
}
