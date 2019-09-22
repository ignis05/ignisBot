var { checkPerms } = require('../../res/Helpers.js')
const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'checkperms',
	aliases: ['checkmypemrs', 'checkbotperms', 'botperms', 'myperms'],
	run: msg => {
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) return

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
