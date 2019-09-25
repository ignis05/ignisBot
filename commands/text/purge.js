module.exports = {
	name: 'purge',
	desc: `deletes messages in bulk`,
	help:
		'`purge` - deletes 5 last messages from current channel and message that called purge\n\n`purge <number>` - deletes specific amount of latest messages\n\n- api prevents messages older than 14 days from being deleted in bulk - in that case bot will delete only as many messages as it can\n\n - bot can delete maximum 100 messages with single purge',
	run: function(msg, recursion) {
		if (!msg.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) {
			console.log('purge failed - insuffiecient permissions')
			msg.reply("You don't have permission 'manage messages' on this channel")
			return
		}
		if (!msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) {
			console.log('purge failed - insuffiecient permissions')
			msg.channel.send("I don't have permission 'manage messages' on this channel")
			return
		}
		var command = msg.content.split(' ')
		if (recursion) command[1] = `${recursion}`

		// if NaN - 5, and no more than 99
		var x = isNaN(command[1]) ? 5 : parseInt(command[1]) < 99 ? parseInt(command[1]) : 99
		console.log(`attempting to purge ${x} messages`)
		msg.channel
			.bulkDelete(x + 1)
			.then(() => {
				console.log('success'.green)
				msg.channel.send(`Deleted ${x} messages.`).then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
			})
			.catch(err => {
				if (err.code == 50034) {
					if (!recursion) {
						msg.channel.send(`Some messages might be older than 14 days.\nCalculating valid purge.\nThis might take a moment...`)
						x++
					}
					if (x > 0) {
						this(msg, x - 1)
					} else {
						msg.channel.send(`Purge failed. No valid messages`)
					}
				} else {
					console.log(err)
					msg.channel.send(`Purge failed.\n${err.message}`)
				}
			})
	},
}
