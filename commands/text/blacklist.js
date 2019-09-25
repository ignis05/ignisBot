var { config } = require('../../res/Helpers.js')

module.exports = {
	name: 'blacklist',
	desc: `disables bot in current channel for non-admin users`,
	help: '`blacklist` - disables bot in current channel for non-admin users, if channel is already disabled, re-enables it',
	run: msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR')) {
			msg.reply("You don't have permission to use this command")
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
