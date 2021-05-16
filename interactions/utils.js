const client = require('../res/client')
var { config, botOwnerID, saveConfig } = require('../res/Helpers.js')
const { MessageAttachment, CommandInteraction } = require('discord.js')

// utils message handler
client.on('message', msg => {
	// jpglarge and pnglarge
	if (msg.author.bot || !msg.guild || !config[msg.guild.id]) return // no bots, enabled guild only
	if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) return // no blacklist
	if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return // must be able to reply

	// utilities for attachments
	if (msg.attachments.size >= 1) {
		// --- jpglarge ---
		if (config[msg.guild.id].utils?.jpglarge) {
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
		}
		// --- redditjpg (jpg with no extention) ---
		if (config[msg.guild.id].utils?.redditjpg) {
			for (let attachment of msg.attachments.values()) {
				if (!/^^RDT_.*jpg$$/.test(attachment.name)) continue
				if (attachment.size > 8000000) {
					msg.channel.send(`Failed to convert reddit jpg from ${msg.author}'s message - file is larger than 8MB`)
					continue
				}
				let converted = new MessageAttachment(attachment.attachment, `${attachment.name.slice(0, -3)}.jpg`)
				msg.channel.send(`Converted reddit jpg from ${msg.author}'s message:`, { files: [converted], allowedMentions: { users: [] } }) // mention without pinging
			}
		}
	}
	// utilities for urls
	else {
		// --- tenorfix ---
		if (/^https:\/\/media\.tenor\.co\/videos\/.*\/mp4$/i.test(msg.content) && msg.embeds.length == 0) {
			console.log('tenor link')
			let attachment = new MessageAttachment(msg.cleanContent, 'fixed.mp4')
			if (attachment.size > 8000000) {
				msg.channel.send(`Failed to fix tenor embed from ${msg.author}'s message - file is larger than 8MB`)
				return
			}
			msg.channel.send(`Fixed tenor embed from ${msg.author}'s message:`, { files: [attachment], allowedMentions: { users: [] } }) // mention without pinging
		}
	}
})

module.exports = {
	commandData: {
		name: 'utils',
		description: "Manages bot's passive functions on guilds. Doesn't work in DMs",
		options: [
			{
				name: 'help',
				type: 'SUB_COMMAND',
				description: 'Lists available utilities and explains what they do',
			},
			{
				name: 'list',
				type: 'SUB_COMMAND',
				description: 'Lists utilities enabled on current guild',
			},
			{
				name: 'enable',
				type: 'SUB_COMMAND',
				description: 'Enables utility',
				options: [
					{
						name: 'utility',
						type: 'STRING',
						description: 'Utility to enable',
						required: true,
						choices: [
							{
								name: 'jpglarge',
								value: 'jpglarge',
							},
							{
								name: 'tenorfix',
								value: 'tenorfix',
							},
							{
								name: 'redditjpg',
								value: 'redditjpg',
							},
						],
					},
				],
			},
			{
				name: 'disable',
				type: 'SUB_COMMAND',
				description: 'Disables utility',
				options: [
					{
						name: 'utility',
						type: 'STRING',
						description: 'Utility to enable',
						required: true,
						choices: [
							{
								name: 'jpglarge',
								value: 'jpglarge',
							},
							{
								name: 'tenorfix',
								value: 'tenorfix',
							},
							{
								name: 'redditjpg',
								value: 'redditjpg',
							},
						],
					},
				],
			},
		],
	},
	/**
	 * @param inter {CommandInteraction}
	 **/
	run: async inter => {
		// guild check
		if (!inter.guild) return inter.reply(`This command can be used only in guilds`, { ephemeral: true })

		// needs admin permissions to use
		if (!inter.member.permissions.has('ADMINISTRATOR') && inter.author.id != botOwnerID) {
			inter.reply("You don't have permission to use this command")
			return
		}

		// if no config create initial
		if (!config[inter.guild.id].utils) {
			config[inter.guild.id].utils = {}
			saveConfig()
		}

		var enable = false
		const cmd = inter.options[0]
		switch (cmd.name) {
			case 'help':
				inter.reply("Use this command to toggle bot's passive utilities in your guild. Available utilities:\n`jpglarge` - bot will fix any image with jpglarge or pnglarge extentions\n`tenorfix` - bot will fix tenor links that didnt embed properly\n`redditjpg` - bot will fix files recognized as jpgs downloaded from reddit with no extention")
				break
			case 'list':
				let resp = Object.keys(config[inter.guild.id].utils)
					.filter(key => config[inter.guild.id].utils[key])
					.reduce((prev, curr) => (prev += `\n\`${curr}\``), 'Currently enabled utilities:')
				inter.reply(resp)
				break
			case 'enable':
				enable = true
			case 'disable':
				var arg = cmd.options[0].value

				// if not changed
				if (config[inter.guild.id].utils[arg] == enable) return inter.reply(`This utility is already ${enable ? 'enabled' : 'disabled'}.`)

				config[inter.guild.id].utils[arg] = enable
				inter.defer()
				await saveConfig()
				inter.editReply(`Utility "${arg}" has been ${enable ? 'enabled' : 'disabled'} succesfully.`)
		}
	},
}
