const { botOwnerId } = require('../../res/Helpers')
module.exports = {
	name: 'embed',
	aliases: ['embeds'],
	desc: `Can supress or unsupress embeds from messages`,
	help: '`embed <clear / restore> <message link>` - bot clear or restore message embed',
	run: async msg => {
		var args = msg.content.split(' ').filter(arg => arg != '')
		var clear = args[1] !== 'restore'
		var link = args.slice(2).join(' ')
		try {
			var msgId = /\d+$/.exec(link)[0]
			var channelId = /(\d+)\/\d+$/.exec(link)[1]
		} catch {
			return msg.channel.send(`Invalid message link.`)
		}

		msg.client.channels
			.fetch(channelId)
			.then(channel => {
				if (!msg.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES') && msg.user.id != botOwnerId) return msg.reply("You don't have permission 'MANAGE_MESSAGES' on this channel")
				if (!msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) return msg.channel.send("I don't have permission 'MANAGE_MESSAGES' on this channel")
				channel.messages
					.fetch(msgId)
					.then(message => {
						message.suppressEmbeds(clear)
						msg.channel.send(`${clear ? 'Removed' : 'Restored'} message embed.`)
					})
					.catch(err => {
						msg.channel.send(`Failed to find message.`)
					})
			})
			.catch(err => {
				msg.channel.send(`Failed to find channel.`)
			})
	},
}
