const { saveConfig } = require('../res/Helpers')

module.exports = {
	commandData: {
		name: 'random',
		description: 'Replies with randomly generated numbers',
		options: [
			{
				name: 'min',
				type: 'INTEGER',
				description: 'Lower limit of rng range',
				required: false,
			},
			{
				name: 'max',
				type: 'INTEGER',
				description: 'Upper limit of rng range',
				required: false,
			},
			{
				name: 'repeat',
				type: 'INTEGER',
				description: 'How many random numbers from that range you need',
				required: false,
			},
			{
				name: 'save',
				type: 'BOOLEAN',
				description: 'Works for guilds only: save parameters as guild default instead of generating numbers',
				required: false,
			},
		],
	},
	run: async inter => {
		var options = {
			min: 1,
			max: 10,
			repeat: 1,
		}

		if (inter.guild && config[inter.guild.id].random) {
			options.min = config[inter.guild.id].random.min
			options.max = config[inter.guild.id].random.max
			options.repeat = config[inter.guild.id].random.repeat || 1 // or 1 to support older configs
		}

		// save = true - save parameters insted of generating numbers
		let save = inter.options.find(o => o.name == 'save')
		if (inter.guild && save && save.value === true) {
			if (!config[inter.guild.id].random) config[inter.guild.id].random = { min: 1, max: 10, repeat: 10 } // create object of not there

			for (let option of inter.options) {
				if (option.name === 'repeat') {
					if (option.value < 1) return inter.reply(`"repeat" must be a positive integer`, { emphereal: true })
					if (option.value > 100) return inter.reply(`"repeat" cant be larger than 100`, { emphereal: true })
				}
				config[inter.guild.id].random[option.name] = option.value
			}
			await saveConfig()
			return inter.reply(`Random number generator was set to: <${config[inter.guild.id].random.min}, ${config[inter.guild.id].random.max}> with ${config[inter.guild.id].random.repeat} repeats.`)
		}

		for (let option of inter.options) {
			if (option.name === 'repeat') {
				if (option.value < 1) return inter.reply(`"repeat" must be a positive integer`, { emphereal: true })
				if (option.value > 100) return inter.reply(`"repeat" cant be larger than 100`, { emphereal: true })
			}
			options[option.name] = option.value
		}

		let str = ''
		for (let i = 0; i < options.repeat; i++) {
			let rand = Math.floor(Math.random() * (options.max + 1 - options.min)) + options.min
			str += `\n${rand}`
		}

		let response = `${options.repeat > 1 ? `Your random numbers picked from:` : `Your random number picked from:`} **[${options.min}, ${options.max}]**:` + str
		if (response.length > 2000) return inter.reply(`Generated message was larger than 2000 characters.\nTry with smaller numbers or less repeats`, { emphereal: true })

		inter.reply(response)
	},
}
