var { config } = require('../../res/Helpers.js')

module.exports = {
	name: 'random',
	aliases: ['rand'],
	run: msg => {
		let min = config[msg.guild.id].random.min
		let max = config[msg.guild.id].random.max
		let rand = Math.floor(Math.random() * (max + 1 - min)) + min
		msg.channel.send(`Your random number <${min}, ${max}>:\n${rand}`)
	},
}
