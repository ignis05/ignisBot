var { saveConfig, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'setrandom',
	aliases: ['setrand'],
	desc: `changes default range for 'random' command`,
	help: '`setrandom <min> <max>` - changes default range for \'random\' command on current guild',
	run: msg => {
		let msg_arr = msg.content.split(' ')
		if (msg_arr.length < 3 || isNaN(msg_arr[1]) || isNaN(msg_arr[2])) {
			msg.channel.send('Wrong arguments')
			return
		}
		let min = parseInt(msg_arr[1])
		let max = parseInt(msg_arr[2])
		config[msg.guild.id].random = { min: min, max: max }
		saveConfig()
		msg.channel.send(`Random number generator was set to: <${min}, ${max}>`)
	},
}
