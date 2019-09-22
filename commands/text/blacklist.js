var { checkPerms, config } = require('../../res/Helpers.js')

module.exports = {
	name: 'blacklist',
	run: msg => {
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}
		if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) {
			var i = config[msg.guild.id].bannedChannels.indexOf(msg.channel.id)
			config[msg.guild.id].bannedChannels.splice(i, 1)
			saveConfig(msg.channel, 'Channel removed from blacklist')
		} else {
			config[msg.guild.id].bannedChannels.push(msg.channel.id)
			saveConfig(msg.channel, 'Channel added to blacklist')
		}
	},
}