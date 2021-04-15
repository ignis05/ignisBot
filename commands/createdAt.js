const moment = require('moment')

module.exports = {
	name: 'createdat',
	categories: ['text', 'dm'],
	aliases: ['createdate', 'joindate'],
	desc: `fetches id creation date from user/channel/server id`,
	help: '`createdAt <id>` - fetches id creation date from id',
	run: msg => {
		var id = msg.content.split(' ').filter(n => n != '')[1]

		var bin = (+id).toString(2)
		var unixbin = ''
		var unix = ''
		var m = 64 - bin.length
		unixbin = bin.substring(0, 42 - m)
		unix = parseInt(unixbin, 2) + 1420070400000
		var timestamp = moment.unix(unix / 1000)
		if (!timestamp.isValid()) return msg.channel.send(`Failed to read timestamp. Make sure the id is valid.`)
		msg.channel.send(`This id was created at ${timestamp.format('DD/MM/YYYY, HH:mm:ss')}`)
	},
}
