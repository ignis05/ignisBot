const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'checkperms',
	aliases: ['botperms', 'myperms'],
	desc: `displays bot's permissions as memebr of current guild`,
	help: "`checkperms` - bot will reposnd with list of it's permissions",
	run: msg => {
		let canDoEmbed = msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')
		if (!canDoEmbed) {
			console.log('no embed permission'.red)
			msg.channel.send("I don't have permission 'embed links' on this channel")
			return
		}

		var perms = msg.guild.me.permissions
			.toArray()
			.map(perm => `- ${perm}`)
			.join('\n')

		const embed = new RichEmbed()
			.setTitle('My permissions on this guild are:')
			.setColor(0xff0000)
			.setDescription(perms)
		msg.channel.send(embed)
	},
}
