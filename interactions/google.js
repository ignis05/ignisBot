// var { saveConfig, config } = require('../res/Helpers.js')
const { getStatus } = require('mc-server-status')
const { CommandInteraction } = require('discord.js')

/**
 * Strips formatting from strings used by minecraft servers to make them readable
 * @param {String} s
 * @returns {String} Parsed plain string
 */
function mcStringFromat(s) {
	let out = s.text
	if (s.extra) out += s.extra.reduce((reducer, a) => reducer + a.text, '')
	return out
}

module.exports = {
	commandData: {
		name: 'google',
		description: 'Generate letmegooglethat.com link with given query',
		options: [
			{
				name: 'query',
				type: 'STRING',
				description: 'Google search query',
				required: true,
			},
			{
				name: 'ephemeral',
				type: 'BOOLEAN',
				description: 'If true, response will only be seen by you',
				required: false,
			},
		],
	},
	/**
	 * @param inter {CommandInteraction}
	 **/
	run: async inter => {
		inter.reply(`<http://letmegooglethat.com/?q=${encodeURIComponent(inter.options[0].value)}>`, { ephemeral: inter.options[1]?.value })
	},
}
