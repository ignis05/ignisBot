const { MessageEmbed } = require('discord.js')

module.exports = {
	commandData: {
		name: 'invite',
		description: 'Generates invite link for adding this bot to your servers',
	},
	run: async inter => {
		console.log('sending invite link'.success)
		let canDoEmbed = !inter.guild || inter.channel.permissionsFor(inter.guild.me).has('EMBED_LINKS')

		let invite = await inter.client.generateInvite({
			permissions: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'CONNECT', 'SPEAK', 'CHANGE_NICKNAME'],
		})

		if (!inter.channel.permissionsFor(inter.guild.me).has('EMBED_LINKS')) return inter.reply(`Generated bot invite link:\n<${invite}>`)

		if (!canDoEmbed) return inter.reply(invite)

		var embed = new MessageEmbed()
			.setTitle('**Invite me to your discord server**')
			.setColor(0x000000)
			.setDescription(`You need to have "Manage Server" permission on the server you want me to join`)
			.setURL(invite)
			.setThumbnail(inter.client.user.displayAvatarURL({ format: 'png' }))
		inter.reply(embed)
	},
}
