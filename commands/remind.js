var { botOwnerId } = require('../res/Helpers')
const { Collection } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const REMINDERS = new Collection()

const fullTimeFormat = 'DD/MM/YYYY HH:mm'

//TODO reminders persist between restarts

module.exports = {
	name: 'remind',
	aliases: ['remindme', 'reminder'],
	categories: ['text', 'dm'],
	desc: `sends a delayed message with a reminder`,
	help: '`remind <time> <msg>` - bot will reposnd with <msg> after <time> has passed\n-time can be passed as minutes (ex: 30m) or hours (ex: 0.5h), or as `h:mm` format\n`remind <time>\\n<msg>` - same, but time can now have spaces and accepts `DD/MM h:mm` format\n`remind list` - lists all pending reminders set in current channel\n`remind del <reminder_ID>` - cancels specific reminder. ID can be obtained from reminders list',
	run: msg => {
		let msgArr = msg.content.split(' ').filter(arg => arg != '')
		if (msgArr[1] == 'list') {
			let list = REMINDERS.filter(reminder => reminder.channel.id == msg.channel.id)
			if (!list || list.size == 0) return msg.channel.send('No reminders set in this channel')
			msg.channel.send(`List:\n${list.map(data => `${data.id} - ${data.date.toLocaleString()} - "${data.msg}"`).join('\n')}`)
			return
		}
		if (['del', 'delete', 'remove', 'rm'].includes(msgArr[1])) {
			let id = msgArr[2]
			if (!id) return msg.channel.send('You need to specify reminder id')
			let reminder = REMINDERS.get(id)
			if (!reminder) return msg.channel.send('Could not find a reminder with given id')
			// if reminder in guild : author or owner or moderator
			if (msg.guild && msg.author.id !== reminder.author.id && msg.author.id !== botOwnerId && !reminder.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) return msg.channel.send("To delete reminder you need to be it's author or have `manage messages` permission")
			clearTimeout(reminder.cancel)
			REMINDERS.delete(reminder.id)
			msg.channel.send(`Deleted reminder ${reminder.id}`)
			return
		}

		// parse reminder content and date checking if newline format is used
		var reminderContent, dateString
		if (msg.content.includes('\n')) {
			let msgArr2 = msg.content.split('\n')
			dateString = msgArr2[0].split(' ')
			dateString.shift()
			dateString = dateString.join(' ')
			reminderContent = msgArr2[1]
		} else {
			msgArr.shift()
			dateString = msgArr.shift()
			reminderContent = msgArr.join(' ')
		}

		console.log(reminderContent, dateString)

		let parsedBy = 'ms'
		let timeout = ms(dateString)
		let date = moment(Date.now() + timeout)
		if (!date.isValid()) {
			date = moment(dateString, 'DD/MM H:mm')
			parsedBy = 'DD/MM H:mm'
			if (!date.isValid()) {
				date = moment(dateString, 'H:mm')
				parsedBy = 'H:mm'
				if (!date.isValid()) return msg.channel.send('Invalid date')
				// add 1 day if date already passed
				if (moment().diff(date) > 0) {
					date.add(1, 'd')
					parsedBy = 'H:mm + 1d'
				}
			}
			timeout = date.diff(moment())
		}

		// larger than 32 bit int - wont work with timeout
		if (timeout > 2147483647) {
			console.log('timeout too big')
			return msg.channel.send("Can't set reminder this far away")
		}

		let snowflake = Date.now().toString(32)
		console.log(`Set reminder on ${date.format(fullTimeFormat)} - time parsed by ${parsedBy}`)
		msg.reply(`Set reminder on ${date.format(fullTimeFormat)}\nReminder id: **${snowflake}**`)
		let timeoutCancel = setTimeout(() => {
			msg.channel.send(`${msg.author} ${reminderContent}`).catch(err => console.log(err.message))
			REMINDERS.delete(snowflake)
		}, timeout)
		REMINDERS.set(snowflake, { channel: msg.channel, cancel: timeoutCancel, msg: reminderContent, date: date.toDate(), author: msg.author, id: snowflake })
	},
}
