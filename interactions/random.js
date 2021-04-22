module.exports = {
	commandData: {
		name: 'random',
		description: 'Replies with randomly generated numbers',
		options: [
			{
				name: 'min',
				type: 'STRING',
				description: 'Lower limit of rng range',
				required: false,
			},
			{
				name: 'max',
				type: 'STRING',
				description: 'Upper limit of rng range',
				required: false,
			},
			{
				name: 'repeat',
				type: 'STRING',
				description: 'How many random numbers from that range you need',
				required: false,
			},
		],
	},
	run: interaction => {
		var min = 0
		var max = 9
		var repeat = 1

		if (interaction.guild && config[interaction.guild.id].random) {
			min = config[interaction.guild.id].random.min
			max = config[interaction.guild.id].random.max
		}

		/* if (tmp_arr[1] === 'set') {
			let min = parseInt(tmp_arr[2])
			let max = parseInt(tmp_arr[3])
			if (isNaN(min) || isNaN(max)) return msg.channel.send('Invalid values')
			config[msg.guild.id].random = { min: min, max: max }
			saveConfig(msg.channel, `Random number generator was set to: <${min}, ${max}>`)
			return
		} */

		for (let option of interaction.options) {
			let tmp
			switch (option.name) {
				case 'min':
					tmp = parseInt(option.value)
					if (!isNaN(tmp) && isFinite(tmp)) min = tmp
					break
				case 'max':
					tmp = parseInt(option.value)
					if (!isNaN(tmp) && isFinite(tmp)) max = tmp
					break
				case 'repeat':
					tmp = parseInt(option.value)
					if (!isNaN(tmp) && isFinite(tmp) && repeat >= 1) repeat = tmp
					break
			}
		}

		let str = ''
		for (let i = 0; i < repeat; i++) {
			let rand = Math.floor(Math.random() * (max + 1 - min)) + min
			str += `\n${rand}`
		}

		interaction.reply(`Here are your random numbers picked from: **< ${min}, ${max} >**:` + str)
	},
}
