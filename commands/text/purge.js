function fetchAfter(msg) {
	return new Promise((resolve, reject) => {
		var count = msg.content.split(' ').filter(arg => arg != '')[1]
		count = count < 100 ? count : 100
		var arg = msg.content.split(' ').filter(arg => arg != '')[2]
		var val = arg.split(':').slice(1).join(':')
		msg.channel.messages
			.fetch(val, false)
			.then(async message => {
				var messages = await msg.channel.messages.fetch({ limit: count, before: msg.id }, false).catch(reject)
				messages = messages.filter(m => m.createdTimestamp > message.createdTimestamp)
				console.log(messages.size)
				resolve(messages)
			})
			.catch(async err => {
				// Invalid Form Body: Value is not snowflake
				if (err.code == 50035) {
					console.log('not snowflake')
					var timestamp
					if (/^\d+(\.\d*)?h(ours?)?$/i.test(val)) {
						timestamp = Date.now() - 1000 * 60 * 60 * parseFloat(val)
					} else if (/^\d+(\.\d*)?m(in(utes?)?)?$/i.test(val)) {
						timestamp = Date.now() - 1000 * 60 * parseFloat(val)
					} else if (/^\d+(\.\d*)?s(ec(onds?)?)?$/i.test(val)) {
						timestamp = Date.now() - 1000 * parseFloat(val)
					} else {
						let parsed = val.split(':').reduce((acc, time) => 60 * acc + parseInt(time), 0)
						if (isNaN(parsed)) return reject({ msg: 'Time format not parsed' })
						timestamp = Date.now() - 1000 * parsed
					}
					var messages = await msg.channel.messages.fetch({ limit: count, before: msg.id }, false).catch(reject)
					messages = messages.filter(m => m.createdTimestamp > timestamp)
					console.log(messages.size)
					resolve(messages)
				} else {
					return reject(err)
				}
			})
	})
}

module.exports = {
	name: 'purge',
	desc: `deletes messages in bulk`,
	help: '`purge` - deletes 5 last messages from current channel and message that called purge\n`purge <number>` - deletes specific amount of latest messages\n`purge <number> [flag]` - deletes specific amount of messages with special restrictions\nAvailable flags: `newer:<msg id / age>` - prevents messages older than "age" or given message from being deleted. Age can be passed in a few different formats: HH:MM:SS, Xsec, Xmin, Xh\n\n- api prevents messages older than 14 days from being deleted in bulk - in that case bot will delete only as many messages as it can\n\n - bot can delete maximum 100 messages with single purge',
	run: async msg => {
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
		var arg = msg.content.split(' ').filter(arg => arg != '')[1]
		var flag = msg.content.split(' ').filter(arg => arg != '')[2]
		if (parseInt(arg) < 1) {
			return msg.channel.send("Delete count can't be lower than 1")
		}

		if (arg === undefined) arg = '5'

		if (isNaN(parseInt(arg))) {
			return msg.channel.send('Invalid delete count')
		}

		//flags:
		var messages = null
		if (flag && flag.includes('newer:')) {
			messages = await fetchAfter(msg).catch(err => {
				if (err.msg == 'Time not parsed') return msg.channel.send('Invalid time format')
				console.error(err)
			})
		}

		//if param search returned something
		if (messages !== null && messages.size < 1) {
			return msg.channel.send('No messages matching query found.')
		}
		// no more than 100
		var x = parseInt(arg) < 100 ? parseInt(arg) : 100
		console.log(`attempting to purge ${x} messages`)
		await msg.delete({ reason: 'Deleted !purge call' })
		msg.channel
			.bulkDelete(messages || x, true)
			.then(deleted => {
				console.log('success'.green)
				msg.channel.send(`Deleted ${deleted.size} messages.`).then(msg => msg.delete({ timeout: config[msg.guild.id].tempMsgTime, reason: 'Deleted temp message' }))
			})
			.catch(err => {
				console.log(err)
				msg.channel.send(`Purge failed.\n${err.message}`)
			})
	},
}
