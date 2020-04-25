var { config, botOwnerID, saveConfig } = require('../../res/Helpers.js')
const client = require('../../res/client')
const { MessageAttachment } = require('discord.js')
const _ = require('lodash')

client.on('message', msg => {
	if (msg.author.bot || !msg.guild || !config[msg.guild.id]) return // no bots, enabled guild only
	if (!config[msg.guild.id].utils || !config[msg.guild.id].utils.jpglarge) return // if jpglarge enabled on guild
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) return // no blacklist and admin override
	if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return // must be able to reply

	if (msg.attachments.size < 1) return
	for (let attachment of msg.attachments.array()) {
		if (!attachment.name.endsWith('.jpglarge')) continue
		let converted = new MessageAttachment(attachment.attachment, attachment.name.substring(0, attachment.name.length - 5))
		msg.channel.send(`Converted jpglarge from ${msg.author.toString()}'s message:`, { files: [converted], allowedMentions: { users: [] } }) // mention without pinging
	}
})

module.exports = {
	name: 'utils',
	desc: `manages utility functions on guild`,
	help: '`utils (enable | disable) <name>` - turns utilities on or off\n\nAvailable utilities:\n**jpglarge** - bot will automatically convert and send back any ".jpglarge" attachment',
	run: msg => {
		if (!msg.member.hasPermission('ADMINISTRATOR') && msg.author.id != botOwnerID) {
			msg.reply("You don't have permission to use this command")
			return
		}

		if (!config[msg.guild.id].utils) {
			config[msg.guild.id].utils = {}
			saveConfig()
		}

		var args = msg.content.toLowerCase().split(' ').slice(1)
		var argsClean = args.filter(arg => ['jpglarge'].includes(arg))
		var enable = args.includes('enable') || args.includes('on')

		for (let arg of argsClean) {
			config[msg.guild.id].utils[arg] = enable
		}
		saveConfig(msg.channel, `Succesfully ${enable ? 'enabled' : 'disabled'} utils:\n${argsClean.join('\n')}`)
	},
}
