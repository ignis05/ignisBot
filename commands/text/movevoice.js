var { botOwnerId } = require('../../res/Helpers')

module.exports = {
	name: 'movevoice',
	desc: `Move all users playing specified game to separate voice channel`,
	help: '`movevoice <partial name>` - moves all members with matching game activity to another empty voice channel within the same category.\nUsers must be visible and have game activity enabled for this to work properly',
	run: msg => {
		var voiceChannel = msg.member.voice.channel
		if (!voiceChannel) return msg.channel.send('You need to be in a voice channel to use this')
		var category = voiceChannel.parent
		if (!category.permissionsFor(msg.guild.me).has('MOVE_MEMBERS')) return msg.channel.send('I need permission MOVE_MEMBERS in this category')
		if (!category.permissionsFor(msg.member).has('MOVE_MEMBERS') && msg.author.id !== botOwnerId) return msg.channel.send("You don't have permission to use this command")
		var emptyVoice = category.children.find(ch => ch.type === 'voice' && ch.members.size == 0)
		// no empty voice channel in category
		if (!emptyVoice) return msg.channel.send('Could not find empty voice channel in current category')
		let arg = msg.content.split(' ').slice(1).join(' ')
		let presences = voiceChannel.members.map(m => m.presence).filter(p => p.activities.length > 0)
		let validMembers = []
		for (let presence of presences) {
			let valid = presence.activities.find(a => a.name.toLowerCase().includes(arg))
			if (valid) validMembers.push(presence.member)
		}
		if (validMembers.length == 0) return msg.channel.send('No mathing members found')
		if (voiceChannel.members.size === validMembers.length) return msg.channel.send('Only matching users are your voice channel')
		for (let member of validMembers) {
			member.voice.setChannel(emptyVoice, `!movevoice used by ${msg.author.tag}`)
		}
		msg.channel.send(`Moving ${validMembers.length} members to separate voice channel`)
	},
}
