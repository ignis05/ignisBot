const { MessageEmbed } = require('discord.js')

module.exports = {
	name: 'invite',
	aliases: ['inv', 'link'],
	categories: ['text', 'dm'],
	desc: 'generates bot invite link',
	help: '`invite` - bot will respond with invite link, that can be used to add bot to another server',
	run: async msg => {
		console.log('sending invite link'.success)
		let invite = await msg.client.generateInvite(70306952)
		if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) return msg.channel.send(`Generated bot invite link:\n<${invite}>`)

		var embed = new MessageEmbed()
			.setTitle('**Invite me to your discord server**')
			.setColor(0x000000)
			.setDescription(`You need to have "Manage Server" permission on the server you want me to join`)
			.setURL(invite)
			.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
		msg.channel.send(embed)
	},
}
