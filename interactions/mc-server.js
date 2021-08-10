// var { saveConfig, config } = require('../res/Helpers.js')
const { getStatus } = require('mc-server-status')
const { MessageEmbed, MessageAttachment, CommandInteraction } = require('discord.js')

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
		name: 'mc-server',
		description: 'Check statuses of minecraft servers',
		options: [
			{
				name: 'url',
				type: 'STRING',
				description: 'IP address or hostname of the minecraft server',
				required: true,
			},
		],
	},
	/**
	 * @param inter {CommandInteraction}
	 **/
	run: async inter => {
		let canDoEmbed = !inter.guild || inter.channel.permissionsFor(inter.guild.me).has('EMBED_LINKS')

		// read command args
		var url = ''
		for (let option of inter.options) {
			if (option.name === 'url') url = option.value
		}

		var status
		try {
			status = await getStatus(url)
		} catch (err) {
			if (err.toString().startsWith('Error: getaddrinfo ENOTFOUND')) {
				// invalid url
				return inter.reply('Could not resolve server address. Make sure the url argument is correct', { ephemeral: true })
			}
		}

		if (!canDoEmbed) inter.reply(`${status ? 'Server online' : 'Server offline'}\nEnable embed messages permission to get more details`)

		var embed = new MessageEmbed().setTitle('**Minecraft Server Status:**').setDescription('This server is currently **offline**').setColor(0xff0000).addField('Address', url)
		if (status) {
			embed
				.setColor(0x00ff00)
				.setDescription('This server is currently **online**')
				.addField('Players', `${status.players.online} / ${status.players.max}`)
				.addField('Status', `${mcStringFromat(status.description)}`)
				.addField('Version', `${status.version.name}`)
			if (status.favicon) {
				var base64Data = status.favicon.replace(/^data:image\/png;base64,/, '')
				const imageStream = Buffer.from(base64Data, 'base64')
				const attachment = new MessageAttachment(imageStream, 'icon.png')
				embed.setThumbnail('attachment://icon.png')
				return inter.reply({ embeds: [embed], files: [attachment] })
			}
		}
		inter.reply({ embeds: [embed] })
	},
}
