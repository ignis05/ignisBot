function timestampFromMsg(val, channel) {
	return new Promise((resolve, reject) => {
		channel.messages
			.fetch(val, false)
			.then(message => {
				resolve(message.createdTimestamp)
			})
			.catch(err => {
				if (err.code == 50035) {
					// Invalid Form Body: Value is not snowflake
					resolve(val)
				} else {
					console.error(err)
					return reject(err)
				}
			})
	})
}

function timestampFromString(val) {
	var timestamp
	if (/^\d+(\.\d*)?h(ours?)?$/i.test(val)) {
		timestamp = Date.now() - 1000 * 60 * 60 * parseFloat(val)
	} else if (/^\d+(\.\d*)?m(in(utes?)?)?$/i.test(val)) {
		timestamp = Date.now() - 1000 * 60 * parseFloat(val)
	} else if (/^\d+(\.\d*)?s(ec(onds?)?)?$/i.test(val)) {
		timestamp = Date.now() - 1000 * parseFloat(val)
	} else {
		let parsed = val.split(':').reduce((acc, time) => 60 * acc + parseInt(time), 0)
		if (isNaN(parsed)) return null
		timestamp = Date.now() - 1000 * parsed
	}
	return timestamp
}

module.exports = {
	name: 'purge',
	desc: `deletes messages in bulk`,
	help: '`purge` - deletes 5 last messages from current channel and message that called purge\n`purge <number>` - deletes specific amount of latest messages\n`purge <number> [flag]` - deletes specific amount of messages with special restrictions\nAvailable flags: `newer:<msg id / age>` - prevents messages older than "age" or given message from being deleted. Age can be passed in a few different formats: HH:MM:SS, Xsec, Xmin, Xh\n\n- api prevents messages older than 14 days from being deleted in bulk - in that case bot will delete only as many messages as it can\n\n - bot can delete maximum 100 messages with single purge',
	run: async msg => {
		if (!msg.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) return msg.reply("You don't have permission 'MANAGE_MESSAGES' on this channel")
		if (!msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) return msg.channel.send("I don't have permission 'MANAGE_MESSAGES' on this channel")

		var args = msg.content
			.split(' ')
			.filter(arg => arg != '')
			.slice(1)

		var deletecount = args.find(a => !isNaN(+a)) || 10
		if (deletecount > 200) deletecount = 200
		console.log('deletecount:', deletecount)
		if (deletecount < 1) return msg.channel.send(`I can't delete ${deletecount} messages`)

		var flags = args
			.filter(a => a.includes(':'))
			.reduce((acc, val) => {
				acc[val.split(':')[0]] = val.split(':').slice(1).join(':')
				return acc
			}, {})
		flags = require('lodash').pick(flags, ['after', 'newer', 'author'])

		if (!require('lodash').isEmpty(flags) || deletecount > 100) {
			// advanced purge - >100 msgs or flags present
			if (flags.after) flags.after = await timestampFromMsg(flags.after)
			if (flags.newer) flags.newer = timestampFromString(flags.newer)
			if (flags.author) flags.author = flags.author.match(/\d+/g).join('')

			var toDeleteCount = deletecount
			var deleteQueue = []
			var lastMsgID = msg.id

			// fetch msgs in group of 100
			while (toDeleteCount > 0) {
				var limit = toDeleteCount <= 100 ? toDeleteCount : 100
				var messages = await msg.channel.messages.fetch({ limit: limit, before: lastMsgID }, false).catch(console.error)
				console.log(messages.size)
				if (messages.size < limit) toDeleteCount = 0 // fetched below limit - no valid msgs to fetch
				lastMsgID = messages.last().id
				// flag filters:

				deleteQueue.push(messages)
				toDeleteCount -= messages.size
			}

			await msg.delete({ reason: 'Deleted !purge call' })

			var actualDeleteCount = 0

			for (msgsToDelete of deleteQueue) {
				let deleted = await msg.channel.bulkDelete(msgsToDelete, true).catch(err => {
					console.log(err)
					msg.channel.send(`Purge failed.\n${err.message}`)
				})
				actualDeleteCount += deleted.size
			}
			console.log(`Succesfully deleted ${actualDeleteCount} messages.`)
			msg.channel.send(`Successfully deleted ${actualDeleteCount} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
		} else {
			// simple purge
			console.log(`attempting to purge ${deletecount} messages`)
			await msg.delete({ reason: 'Deleted !purge call' })
			msg.channel
				.bulkDelete(deletecount, true)
				.then(deleted => {
					console.log('success'.green)
					msg.channel.send(`Deleted ${deleted.size} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
				})
				.catch(err => {
					console.log(err)
					msg.channel.send(`Purge failed.\n${err.message}`)
				})
		}
	},
}
