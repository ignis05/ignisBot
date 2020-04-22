var { config } = require('../res/Helpers.js')

module.exports = {
	name: 'random',
	aliases: ['rand'],
	categories: ['text', 'dm'],
	desc: 'returns random number',
	help: '`random` - return random number from default range: <0, 10>\n- on guild default range can be changed with `setrandom`\n\n`random <min> <max> [x]` - returns x random numbers using specified range. x defaults to 1',
	run: msg => {
		let min, max
		if (msg.guild && config[msg.guild.id].random) {
			min = config[msg.guild.id].random.min
			max = config[msg.guild.id].random.max
		}
		let tmp_arr = msg.content.split(' ')
		tmp_arr[1] = parseInt(tmp_arr[1])
		tmp_arr[2] = parseInt(tmp_arr[2])
		tmp_arr[3] = parseInt(tmp_arr[3])
		if (tmp_arr.length >= 3 && !isNaN(tmp_arr[1]) && !isNaN(tmp_arr[2])) {
			min = tmp_arr[1]
			max = tmp_arr[2]
		}
		if (min === undefined || max === undefined) {
			min = 1
			max = 10
		}
		let repeat = tmp_arr[3]
		if (!isNaN(repeat) && repeat > 0) {
			repeat = repeat <= 50 ? repeat : 50
			let str = ''
			for (let i = 0; i < repeat; i++) {
				let rand = Math.floor(Math.random() * (max + 1 - min)) + min
				str += `\n${rand}`
			}
			msg.channel.send(`Here are your random numbers picked from: **< ${min}, ${max} >**:` + str)
		} else {
			let rand = Math.floor(Math.random() * (max + 1 - min)) + min
			msg.channel.send(`Here is your random number picked from: **< ${min}, ${max} >**:\n${rand}`)
		}
	},
}
