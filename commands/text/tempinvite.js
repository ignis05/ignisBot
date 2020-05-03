var { botOwnerID } = require('../../res/Helpers')
const { MessageEmbed } = require('discord.js')

module.exports = {
	name: 'tempinvite',
	aliases: ['voiceinvite'],
	desc: `Generates single use voice channel invite granting temporary membership`,
	help: '`tempinvite [hours]` - generates direct invite to your current voice channel, limited to single use and 24 (or different number - use parameter) hours\n\nUsers who joins using this invite will be removed when they go offline (not invisible) unless thay are granted a role\nIf autorole is enabled you will need to temporarily disable it or users will be automatically granted permanent membership',
	run: async msg => {
		let voiceChannel = msg.member.voice.channel
		if (!voiceChannel) return msg.channel.send('This command generates invite to voice channel - you need to be in one to use it')
		if (!voiceChannel.permissionsFor(msg.guild.me).has('CREATE_INSTANT_INVITE')) return msg.channel.send("I can't invite users to this guild")
		if (!voiceChannel.permissionsFor(msg.author).has('CREATE_INSTANT_INVITE') && msg.author.id != botOwnerID) return msg.reply("You don't have permission to use this command")

		let time = msg.content
			.split(' ')
			.filter(arg => arg != '')
			.slice(1)
			.join(' ')

		if (time.endsWith('h')) time = time.slice(0, -1)
		time = parseFloat(time)
		if (isNaN(time)) time = 24

		let maxAge = time * 3600
		let invite = await voiceChannel.createInvite({ temporary: true, maxAge, maxUses: 1, unique: true, reason: `Command used by ${msg.author.tag}` })
		if (msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
			var embed = new MessageEmbed()
				.setTitle('Generated temporary invite')
				.setDescription(`This is single use invite granting temporary membership.\nUsers who joins using this invite will be removed when they go offline (not invisible) unless thay are granted a role\nIf autorole is enabled you will need to temporarily disable it or users be will automatically granted permanent membership`)
				.setColor(0x00ff00)
				.addField('Invite', invite.toString())
				.setThumbnail(msg.guild.iconURL({ format: 'png' }))
				.setTimestamp()
			msg.channel.send(embed)
		} else {
			msg.channel.send(invite.toString())
		}
	},
}
