const { CommandInteraction } = require('discord.js')

module.exports = {
	commandData: {
		name: 'ping',
		description: 'Replies and measures latency',
	},
	/**
	 * @param inter {CommandInteraction}
	 **/
	run: inter => {
		let lat = Date.now() - inter.createdTimestamp
		console.log('Pong!'.rainbow, lat)
		inter.reply(`Pong! **${lat}ms**`)
	},
}
