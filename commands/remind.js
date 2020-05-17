var { botOwnerID } = require('../res/Helpers')
const { Collection } = require('discord.js')
const REMINDERS = new Collection()

module.exports = {
	name: 'remind',
	aliases: ['remindme', 'reminder'],
	categories: ['text', 'dm'],
	desc: `sends a delayed message with a reminder`,
	help: '`remind <time> <msg>` - bot will reposnd with <msg> after <time> has passed\n-time can be passed as minutes (ex: 30) or hours (ex: 0.5h) or as [epoh timestamp](https://www.epochconverter.com/)\n`remind list` - lists all pending reminders set in current channel\n`remind del <reminder_ID>` - cancels specific reminder. ID can be obtained from reminders list',
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
			if (msg.guild && msg.author.id !== reminder.author.id && msg.author.id !== botOwnerID && !reminder.channel.permissionsFor(msg.member).has('MANAGE_MESSAGES')) return msg.channel.send("To delete reminder you need to be it's author or have `manage messages` permission")
			clearTimeout(reminder.cancel)
			REMINDERS.delete(reminder.id)
			msg.channel.send(`Deleted reminder ${reminder.id}`)
			return
		}
		let time = msgArr[1].replace(',', '.')
		let pureTime = time.endsWith('h') ? parseFloat(time.slice(0, -1)) * 60 : parseFloat(time)
		if (isNaN(pureTime)) {
			console.log('NaN')
			msg.reply(`Invalid argument - NaN`)
			return
		}
		var timeout = pureTime * 60000
		// 25.04.2020 - epoch timestamp
		if (pureTime > 1587823909) {
			timeout = pureTime * 1000 - Date.now()
		}
		var remindDate = new Date(Date.now() + timeout)
		let snowflake = Date.now().toString(32)
		console.log(`Set reminder on ${remindDate.toLocaleString()}`)
		msg.reply(`Set reminder on ${remindDate.toLocaleString()}\nReminder id: **${snowflake}**`)
		var remindMessage = msgArr.slice(2).join(' ')
		let timeoutCancel = msg.client.setTimeout(() => {
			msg.channel.send(`${msg.author} ${remindMessage}`).catch(err => console.log(err.message))
			REMINDERS.delete(snowflake)
		}, timeout)
		REMINDERS.set(snowflake, { channel: msg.channel, cancel: timeoutCancel, msg: remindMessage, date: remindDate, author: msg.author, id: snowflake })
	},
}
