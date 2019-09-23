var { config } = require('../res/Helpers.js')

module.exports = {
	name: 'random',
	aliases: ['rand'],
	categories: ['text', 'dm'],
	desc: 'returns random number',
	help: '`random` - return random number from default range: <0, 10>\n- on guild default range can be changed with `setrandom`\n\n`random <min> <max>` - returns random number using specified range',
	run: msg => {
		let min, max
		if (msg.guild) {
			min = config[msg.guild.id].random.min
			max = config[msg.guild.id].random.max
		}
		let tmp_arr = msg.content.split(' ')
		tmp_arr[1] = parseInt(tmp_arr[1])
		tmp_arr[2] = parseInt(tmp_arr[2])
		if (tmp_arr.length == 3 && !isNaN(tmp_arr[1]) && !isNaN(tmp_arr[2])) {
			min = tmp_arr[1]
			max = tmp_arr[2]
		}
		if (min === undefined || max === undefined) {
			min = 1
			max = 10
		}
		let rand = Math.floor(Math.random() * (max + 1 - min)) + min
		msg.channel.send(`Your random number <${min}, ${max}>:\n${rand}`)
	},
}
