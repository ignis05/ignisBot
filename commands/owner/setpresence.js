var { saveConfig, config } = require('../../res/Helpers.js')

const helpmsg = `\`setpresence (a == activity | s == status | r == reload)\`\n\`setpresence activity (online | idle | invisible | dnd)\`\n\`setpresence status (name | type | url)\`\n\`setpresence status type (PLAYING | STREAMING | LISTENING | WATCHING)\`\n\n\`setpresence reload\``

module.exports = {
	name: 'setpresence',
	run: msg => {
		let args = msg.content
			.split(' ')
			.slice(1)
			.filter(a => a != '')
		switch (args[0] && args[0].toLowerCase()) {
			case 'activity':
			case 'a':
				switch (args[1] && args[1].toLowerCase()) {
					case 'name':
						let name = args.slice(2).join(' ')
						if (!name) return msg.channel.send(helpmsg)
						config.presence.activity.name = name
						saveConfig(msg.channel, `Set activity name to **${name}**`)
						msg.client.user.setPresence(config.presence)
						break
					case 'type':
						let type = args[2] && args[2].toUpperCase()
						if (!['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'].includes(type)) return msg.channel.send(helpmsg)
						config.presence.activity.type = type
						saveConfig(msg.channel, `Set activity type to ${type}`)
						msg.client.user.setPresence(config.presence)
						break
					case 'url':
						let url = args[2]
						if (!url) return msg.channel.send(helpmsg)
						config.presence.activity.url = url
						saveConfig(msg.channel, `Set stream url to ${url}`)
						msg.client.user.setPresence(config.presence)
						break
					default:
						msg.channel.send(helpmsg)
				}
				break
			case 'status':
			case 's':
				let status = args[1] && args[1].toLowerCase()
				if (!['online', 'idle', 'invisible', 'dnd'].includes(status)) return msg.channel.send(helpmsg)
				config.presence.status = status
				saveConfig(msg.channel, `Set status to ${status}`)
				msg.client.user.setStatus(status)
				break
			case 'r':
			case 'reload':
			case 'refresh':
				msg.client.user.setPresence(config.presence)
				break
			default:
				msg.channel.send(helpmsg)
		}
	},
}
