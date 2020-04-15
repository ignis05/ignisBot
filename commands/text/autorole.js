var { saveConfig, config, ignisID } = require('../../res/Helpers.js')

module.exports = {
	name: 'autorole',
	aliases: ['joinrole'],
	desc: `set up role automatically given to new members`,
	help: "`autorole [@mention]` - changes autorole to mentioned role. If no role is mentioned disables autorole.\nMake sure mentioned role is lower in hierarchy and bot has 'manage roles' permission.",
	run: msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR') && msg.author.id != ignisID) {
			msg.reply("You don't have permission to use this command")
			return
		}
		let role = msg.mentions.roles.array()[0]
		if (role) {
			if (msg.guild.me.roles.highest.comparePositionTo(role) < 1) {
				msg.channel.send("Selected role must be lower in hierarchy that bot's highest role.\nAutorole disabled.")
				config[msg.guild.id].autorole = null
				saveConfig()
				return
			}
			if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
				msg.channel.send('I need MANAGE_ROLES permission to do that.\nAutorole disabled.')
				config[msg.guild.id].autorole = null
				saveConfig()
				return
			}

			msg.channel.send(`Autorole set to ${role}`)
			config[msg.guild.id].autorole = role.id
			saveConfig()
		} else {
			msg.channel.send('Autorole disabled.')
			config[msg.guild.id].autorole = null
			saveConfig()
		}
	},
}
