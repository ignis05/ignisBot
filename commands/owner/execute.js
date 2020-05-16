let _ = require('lodash')
let Helpers = require('../../res/Helpers')
const fetch = require('node-fetch')

module.exports = {
	name: 'execute',
	run: async msg => {
		var attachment = msg.attachments.find(a => a.name.endsWith('.js'))

		var content = msg.cleanContent.split(' ').slice(1).join(' ')
		if (!content && !attachment) return msg.channel.send('No command provided')
		var command = ''
		if (attachment) {
			let response = await fetch(attachment.attachment)
			let data = await response.text()
			if (!data) return msg.channel.send('Failed to read attachment')
			command = data.replace('\n', ';')
		} else {
			let temp = content.split('```')
			if (temp.length < 3) return msg.channel.send('Wrap your code as multi line code with: ```')
			command = temp[1].replace('\n', ';')
			if (command.startsWith('js')) command = command.slice(2)
		}
		console.log('executing:\n', command)
		const func = Function('msg', '_', 'Helpers', command)
		try {
			func(msg, _, Helpers)
		} catch (err) {
			msg.channel.send(`error:\n${err}`)
		}
	},
}
