module.exports = {
	commandData: {
		name: 'wall',
		description: 'Replies with a "wall" of line breaks',
		options: [
			{
				name: 'ephemeral',
				type: 'BOOLEAN',
				description: 'If true, response will only be seen by you',
				required: false,
			},
		],
	},
	run: inter => {
		var ephemeral = ''
		for (let option of inter.options) {
			if (option.name === 'ephemeral') ephemeral = option.value
		}

		// uses mongolian vowel separator betwwen \n
		inter.reply('\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n', { ephemeral })
	},
}
