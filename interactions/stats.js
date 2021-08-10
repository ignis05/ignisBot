const path = require('path')
const { MessageEmbed, CommandInteraction } = require('discord.js')
var { countLines } = require('../res/Helpers')

/**
 * Converts number of milisecond to string with days, hours, seconds and minutes
 * @param {Number} millisec
 * @returns {String} Fromatted string counting days, hours, seconds and minutes
 */
function msToString(millisec) {
	var seconds = (millisec / 1000).toFixed(1)
	var minutes = (millisec / (1000 * 60)).toFixed(1)
	var hours = (millisec / (1000 * 60 * 60)).toFixed(1)
	var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1)

	if (seconds < 60) return seconds + ' seconds'
	if (minutes < 60) return minutes + ' minutes'
	if (hours < 24) return hours + ' hours'
	return days + ' days'
}

module.exports = {
	commandData: {
		name: 'stats',
		description: `Displays bot statistics`,
	},
	/**
	 * @param inter {CommandInteraction}
	 **/
	run: async inter => {
		inter.defer()
		var code = await countLines()
		var guilds = [...inter.client.guilds.cache.values()].map(guild => guild.name)
		if (!inter.guild || inter.channel.permissionsFor(inter.guild.me).has('EMBED_LINKS')) {
			var embed = new MessageEmbed()
				.setTitle(`Bot statistics`)
				.setColor(0x00ffff)
				.setThumbnail(inter.client.user.displayAvatarURL({ format: 'png' }))
				.addField('Code', `My code currently consinsts of **${code.lines}** lines,\nand is divided between **${code.files}** files.`)
				.addField('Guilds', `I am currently in **${guilds.length}** guilds:\n${guilds.join(', ')}`)
				.addField('Uptime', `I've been running for ${msToString(inter.client.uptime)}`)
			inter.editReply(embed)
		} else {
			inter.editReply(`Allow embeds for prettier outputs.\nMy code currently consinsts of **${code.lines}** lines,\nand is divided between **${code.files}** files.\nI am currently in **${guilds.length}** guilds:\n${guilds.join(', ')}\nI've been running for ${msToString(inter.client.uptime)}`)
		}
	},
}
