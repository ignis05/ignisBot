const client = require('../res/client')
var { config, botOwnerId, saveConfig } = require('../res/Helpers.js')
const { MessageAttachment, CommandInteraction } = require('discord.js')

// utils message handler
client.on('messageCreate', msg => {
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
					msg.reply(`Failed to convert ${type} - file is larger than 8MB`)
					continue
				}
				let converted = new MessageAttachment(attachment.attachment, attachment.name.substring(0, attachment.name.length - 5))
				msg.reply(`Converted ${type}:`, { files: [converted], allowedMentions: { users: [] } }) 
			}
		}
		// --- jpgorig ---
		if (config[msg.guild.id].utils?.jpglarge) {
			for (let attachment of msg.attachments.values()) {
				if (!attachment.name.endsWith('.jpgorig') && !attachment.name.endsWith('.pngorig')) continue
				let type = attachment.name.slice(-7)
				if (attachment.size > 8000000) {
					msg.reply(`Failed to convert ${type} - file is larger than 8MB`)
					continue
				}
				let converted = new MessageAttachment(attachment.attachment, attachment.name.substring(0, attachment.name.length - 4))
				msg.reply(`Converted ${type}:`, { files: [converted], allowedMentions: { users: [] } }) 
			}
		}
		// --- redditjpg (jpg with no extention) ---
		if (config[msg.guild.id].utils?.redditjpg) {
			for (let attachment of msg.attachments.values()) {
				if (!/^RDT_.*\djpg$/.test(attachment.name)) continue
				if (attachment.size > 8000000) {
					msg.reply(`Failed to convert reddit jpg - file is larger than 8MB`)
					continue
				}
				let converted = new MessageAttachment(attachment.attachment, `${attachment.name.slice(0, -3)}.jpg`)
				msg.reply(`Fixed reddit jpg:`, { files: [converted], allowedMentions: { users: [] } }) 
			}
		}

		// --- mp4fix (mp4 files with no extention) ---
		if (config[msg.guild.id].utils?.mp4fix) {
			for (let attachment of msg.attachments.values()) {
				if (!/^mp4-\d+$/.test(attachment.name)) continue
				if (attachment.size > 8000000) {
					msg.reply(`Failed to convert mp4 - file is larger than 8MB`)
					continue
				}
				let converted = new MessageAttachment(attachment.attachment, `${attachment.name}.mp4`)
				msg.reply(`Fixed mp4 file:`, { files: [converted], allowedMentions: { users: [] } }) 
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
				msg.channel.send(`Failed to fix tenor embed - file is larger than 8MB`)
			} else msg.channel.send(`Fixed tenor embed:`, { files: [attachment], allowedMentions: { users: [] } }) 
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
							{
								name: 'mp4fix',
								value: 'mp4fix',
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
							{
								name: 'mp4fix',
								value: 'mp4fix',
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
		if (!inter.member.permissions.has('ADMINISTRATOR') && inter.author.id != botOwnerId) {
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
				inter.reply("Use this command to toggle bot's passive utilities in your guild. Available utilities:\n`jpglarge` - bot will fix any image with jpglarge/jpgorig or pnglarge/pngorig extentions\n`tenorfix` - bot will fix tenor links that didnt embed properly\n`redditjpg` - bot will fix files recognized as jpgs downloaded from reddit with no extention\n`mp4fix` - bot will reupload files recognized as mp4 without extention")
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
				inter.editReply(`Utility "${arg}" has been succesfully ${enable ? 'enabled' : 'disabled'}.`)
		}
	},
}
