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
					resolve(val * 1000)
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
	help:
		"`purge` - deletes 10 last messages from current channel plus the message that called purge\n`purge <number> [flag1] [flag2] [...]` - delete specific number of messages. Flags allow to set restrictions.\n\n**Available flags:**\n**after:<msg id | [epoh timestamp (sec)](https://www.epochconverter.com/) >** - will only delete messages created after given timestamp of newer than given message\n**newer:<age>** - will only delete messages newer than given time (ex:30min) - accepts time in few different formats - ex: '3.5h', '25min', '120sec', '1:30', '1:20:00'\n**author:<mention | id>**- will only delete messages created by given user \n\n**Example usage with flags:**\n`purge 20 author:@ignisBot newer:1h` - will delete up to 20 messages created by ignisBot within last hour\n\n**Things to be aware of:**\n- Discord API prevents messages older than 14 days from being deleted in bulk - in that case bot will delete only as many messages as it can\n- Bot can delete up to 1000 messages with single purge\n- Purges larger than 10 messages won't be logged in message log",
	run: async msg => {
		if (!msg.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) return msg.reply("You don't have permission 'MANAGE_MESSAGES' on this channel")
		if (!msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) return msg.channel.send("I don't have permission 'MANAGE_MESSAGES' on this channel")

		var args = msg.content
			.split(' ')
			.filter(arg => arg != '')
			.slice(1)

		var deletecount = args.find(a => !isNaN(+a)) || 10
		if (deletecount > 1000) deletecount = 1000
		if (deletecount < 1) return msg.channel.send(`I can't delete ${deletecount} messages`)

		var flags = args
			.filter(a => a.includes(':'))
			.reduce((acc, val) => {
				acc[val.split(':')[0]] = val.split(':').slice(1).join(':')
				return acc
			}, {})
		flags = require('lodash').pick(flags, ['after', 'newer', 'author'])
		console.log(flags)

		if (!require('lodash').isEmpty(flags) || deletecount > 100) {
			// advanced purge - >100 msgs or flags present
			if (flags.after) flags.after = await timestampFromMsg(flags.after, msg.channel)
			if (flags.author) {
				let temp = flags.author.match(/\d+/g)
				if (!temp) return msg.channel.send('Invalid author flag - purge aborted')
				temp = temp.join('')
				let x = await msg.client.users.fetch(temp, false).catch(err => {
					console.log(err)
				})
				if (!x) return msg.channel.send('Invalid author flag - purge aborted')
				flags.author = temp
			}

			if (flags.newer) {
				flags.newer = timestampFromString(flags.newer)
				if (!flags.newer) return msg.channel.send('Invalid time format - purge aborted')
				// merge into flags.after - pick bigger number
				flags.after = flags.after > flags.newer ? flags.after : flags.newer
			}

			var toDeleteCount = deletecount
			var deleteQueue = []
			var lastMsgID = msg.id

			// fetch msgs in group of 100
			var operationLimit = 100 // stop after 100 fetches
			while (operationLimit > 0 && toDeleteCount > 0) {
				var limit = toDeleteCount <= 100 ? toDeleteCount : 100
				var messages = await msg.channel.messages.fetch({ limit: limit, before: lastMsgID }, false).catch(console.error)
				console.log('fetched to delete:', messages.size)
				if (messages.size < limit) toDeleteCount = 0 // fetched below limit - no valid msgs to fetch
				lastMsgID = messages.last().id
				if (messages.last().createdTimestamp < Date.now() - 1000 * 60 * 60 * 24 * 15) toDeleteCount = 0 // messages older than 14 days - cant be deleted anyway
				// flag filters:
				if (flags.after) {
					// flags.newer is merged into this
					let tempSize = messages.size
					messages = messages.filter(m => m.createdTimestamp > flags.after)
					if (messages.size < tempSize) toDeleteCount = 0 // found messages older than limit - fetched messages will keep getting older so no point fetching
				}
				if (flags.author) {
					messages = messages.filter(m => m.author.id == flags.author)
				}
				console.log('valid to delete:', messages.size)
				// concat to existing collection if possible
				var concated = false
				for (i in deleteQueue) {
					if (deleteQueue[i].size + messages.size <= 100) {
						deleteQueue[i] = deleteQueue[i].concat(messages)
						concated = true
					}
				}
				if (!concated) deleteQueue.push(messages)
				toDeleteCount -= messages.size
				operationLimit--
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
			msg.channel.send(`Successfully deleted ${actualDeleteCount} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
		} else {
			// simple purge
			await msg.delete({ reason: 'Deleted !purge call' })
			msg.channel
				.bulkDelete(deletecount, true)
				.then(deleted => {
					msg.channel.send(`Deleted ${deleted.size} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
				})
				.catch(err => {
					console.log(err)
					msg.channel.send(`Purge failed.\n${err.message}`)
				})
		}
	},
}
