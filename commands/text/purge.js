module.exports = {
	name: 'purge',
	desc: `deletes messages in bulk`,
	help: '`purge` - deletes 5 last messages from current channel and message that called purge\n\n`purge <number>` - deletes specific amount of latest messages\n\n- api prevents messages older than 14 days from being deleted in bulk - in that case bot will delete only as many messages as it can\n\n - bot can delete maximum 100 messages with single purge',
	run: msg => {
		if (!msg.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) {
			console.log('purge failed - insuffiecient permissions')
			msg.reply("You don't have permission 'MANAGE_MESSAGES' on this channel")
			return
		}
		if (!msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) {
			console.log('purge failed - insuffiecient permissions')
			msg.channel.send("I don't have permission 'MANAGE_MESSAGES' on this channel")
			return
		}
		var command = msg.content.split(' ')
		if (parseInt(command[1]) < 1) {
			msg.channel.send("Delete count can't be lower than 1")
			return
		}

		// if NaN - 5, and no more than 99
		var x = isNaN(command[1]) ? 5 : parseInt(command[1]) < 99 ? parseInt(command[1]) : 99
		console.log(`attempting to purge ${x} messages`)
		msg.channel
			.bulkDelete(x + 1, true)
			.then(deleted => {
				console.log('success'.green)
				if (deleted.size == x + 1) {
					msg.channel.send(`Deleted ${deleted.size - 1} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
				} else {
					msg.channel.send(`Deleted ${deleted.size - 1} messages.\nSome messages were older than 14 days and couldn't be deleted.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
				}
			})
			.catch(err => {
				console.log(err)
				msg.channel.send(`Purge failed.\n${err.message}`)
			})
	},
}
