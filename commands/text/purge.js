const { checkPerms } = require('../../res/Helpers.js')

module.exports = {
	name: 'purge',
	run: function(msg, recursion) {
		var command = msg.content.split(' ')
		if (recursion) command[1] = `${recursion}`
		if (!checkPerms(msg.author.id, 'purge', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}
		var x
		if (command[1] == undefined) {
			x = 5
		} else {
			x = parseInt(command[1]) < 100 ? parseInt(command[1]) : 100
		}
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
					msg.channel.send(`Purge failed. Permissions might be insufficient`)
				}
			})
	},
}
