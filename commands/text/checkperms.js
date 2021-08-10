const { MessageEmbed } = require('discord.js')

module.exports = {
	name: 'checkperms',
	aliases: ['botperms', 'myperms'],
	desc: `displays bot's permissions as a member of the current guild`,
	help: "`checkperms` - bot will respond with a list of it's permissions",
	run: msg => {
		let canDoEmbed = msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')

		var perms = msg.guild.me.permissions
			.toArray()
			.map(perm => `- ${perm}`)
			.join('\n')

		const embed = new MessageEmbed().setTitle('My permissions on this guild are:').setColor(0xff0000).setDescription(perms)

		if (canDoEmbed) {
			msg.channel.send({ embeds: [embed] })
			return
		}
		msg.channel.send(`**My permissions on this guild are:**\n${perms}`)
	},
}
