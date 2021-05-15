var { config, botOwnerID, saveConfig } = require('../../res/Helpers.js')
const client = require('../../res/client')
const { MessageAttachment } = require('discord.js')
const _ = require('lodash')

// jpglarge and pnglarge
client.on('message', msg => {
	if (msg.author.bot || !msg.guild || !config[msg.guild.id]) return // no bots, enabled guild only
	if (!config[msg.guild.id].utils || !config[msg.guild.id].utils.jpglarge) return // if jpglarge enabled on guild
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) return // no blacklist and admin override
	if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return // must be able to reply

	if (msg.attachments.size < 1) return
	for (let attachment of msg.attachments.values()) {
		if (!attachment.name.endsWith('.jpglarge') && !attachment.name.endsWith('.pnglarge')) continue
		let type = attachment.name.slice(-8)
		if (attachment.size > 8000000) {
			msg.channel.send(`Failed to convert ${type} from ${msg.author}'s message - file is larger than 8MB`)
			continue
		}
		let converted = new MessageAttachment(attachment.attachment, attachment.name.substring(0, attachment.name.length - 5))
		msg.channel.send(`Converted ${type} from ${msg.author}'s message:`, { files: [converted], allowedMentions: { users: [] } }) // mention without pinging
	}
})

// tenor fix
client.on('message', msg => {
	if (msg.author.bot || !msg.guild || !config[msg.guild.id]) return // no bots, enabled guild only
	if (!config[msg.guild.id].utils || !config[msg.guild.id].utils.tenorfix) return // if tenorfix enabled on guild
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) return // no blacklist and admin override
	if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return // must be able to reply
	if (/^https:\/\/media\.tenor\.co\/videos\/.*\/mp4$/i.test(msg.content) && msg.embeds.length == 0) {
		console.log('tenor link')
		let attachment = new MessageAttachment(msg.cleanContent, 'fixed.mp4')
		if (attachment.size > 8000000) {
			msg.channel.send(`Failed to fix tenor embed from ${msg.author}'s message - file is larger than 8MB`)
			return
		}
		msg.channel.send(`Fixed tenor embed from ${msg.author}'s message:`, { files: [attachment], allowedMentions: { users: [] } }) // mention without pinging
	}
})

// reddit no extention jpg
client.on('message', msg => {
	if (msg.author.bot || !msg.guild || !config[msg.guild.id]) return // no bots, enabled guild only
	if (!config[msg.guild.id].utils || !config[msg.guild.id].utils.redditjpg) return // if tenorfix enabled on guild
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) return // no blacklist and admin override
	if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return // must be able to reply

	if (msg.attachments.size < 1) return
	for (let attachment of msg.attachments.values()) {
		if (!/^^RDT_.*jpg$$/.test(attachment.name)) continue
		if (attachment.size > 8000000) {
			msg.channel.send(`Failed to convert reddit jpg from ${msg.author}'s message - file is larger than 8MB`)
			continue
		}
		let converted = new MessageAttachment(attachment.attachment, `${attachment.name.slice(0, -3)}.jpg`)
		msg.channel.send(`Converted reddit jpg from ${msg.author}'s message:`, { files: [converted], allowedMentions: { users: [] } }) // mention without pinging
	}
})

module.exports = {
	name: 'utils',
	desc: `manages utility functions on guild`,
	help: '`utils (enable | disable) <name>` - turns utilities on or off\n\nAvailable utilities:\n**jpglarge** - bot will automatically convert and send back any ".jpglarge" or ".pnglarge" attachments\n**tenorfix** - bot will reupload media.tenor links that failed to embed properly\n**redditjpg** - bot will attachments with name starting with RED_ and ending with jpg',
	run: msg => {
		if (!msg.member.permissionsIn(msg.channel).has('ADMINISTRATOR') && msg.author.id != botOwnerID) {
			msg.reply("You don't have permission to use this command")
			return
		}

		if (!config[msg.guild.id].utils) {
			config[msg.guild.id].utils = {}
			saveConfig()
		}

		var args = msg.content.toLowerCase().replace('pnglarge', 'jpglarge').split(' ').slice(1) // replace pnglarge with jpglarge since its the same

		var argsClean = args.filter(arg => ['jpglarge', 'tenorfix','redditjpg'].includes(arg))
		var enable = args.includes('enable') || args.includes('on')

		for (let arg of argsClean) {
			config[msg.guild.id].utils[arg] = enable
		}
		saveConfig(msg.channel, `Succesfully ${enable ? 'enabled' : 'disabled'} utils:\n${argsClean.join('\n')}`)
	},
}
