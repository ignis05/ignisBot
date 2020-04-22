const path = require('path')
const fs = require('fs')
const { MessageEmbed } = require('discord.js')
var { countLines } = require('../res/Helpers')

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
	name: 'stats',
	categories: ['text', 'dm'],
	desc: `displays bot statistics`,
	help: "`stats` - will send message with bot's statistics",
	run: async msg => {
		var code = await countLines()
		var guilds = msg.client.guilds.cache.array().map(guild => guild.name)
		if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
			var embed = new MessageEmbed()
				.setTitle(`Bot statistics`)
				.setColor(0x00ffff)
				.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
				.addField('Code', `My code currently consinsts of **${code.lines}** lines,\nand is divided between **${code.files}** files.`)
				.addField('Guilds', `I am currently in **${guilds.length}** guilds:\n${guilds.join(', ')}`)
				.addField('Uptime', `I've been running for ${msToString(msg.client.uptime)}`)
			msg.channel.send(embed)
		} else {
			msg.channel.send(`Allow embeds for prettier outputs.\nMy code currently consinsts of **${code.lines}** lines,\nand is divided between **${code.files}** files.\nI am currently in **${guilds.length}** guilds:\n${guilds.join(', ')}\nI've been running for ${msToString(msg.client.uptime)}`)
		}
	},
}
