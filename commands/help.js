var { fetchCommands, config } = require('../res/Helpers.js')
const { MessageEmbed } = require('discord.js')

module.exports = {
	name: 'help',
	aliases: ['man'],
	categories: ['text', 'dm'],
	desc: 'Provides help and info about commands and functions',
	help: '`help` - displays list of all commands\n\n`help [command]` - provides info about specific command',
	run: msg => {
		console.log('generating help'.accent)

		let canDoEmbed = !msg.guild || msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')

		let commands = fetchCommands(false)

		if (msg.content.split(' ').filter(arg => arg != '').length > 1) {
			let command = msg.content.split(' ').filter(arg => arg != '')[1]
			console.log('searching for command ' + command)
			let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
			console.log(`${cmd ? 'found' : 'not found'}`)
			if (!cmd) return msg.channel.send(`Command ${command} not found - try !help to list all commands`)
			var embed = new MessageEmbed()
				.setTitle(`**${cmd.name}** - info:`)
				.setColor(cmd.categories ? 0xff00ff : 0x00ffff)
				.setDescription(`${cmd.aliases.length > 0 ? `Aliases: *${cmd.aliases.join(', ')}*\n` : ''}\n${cmd.help ? cmd.help : 'no help provided'}`)
				.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
			if (canDoEmbed) msg.channel.send({ embeds: [embed] })
			else msg.channel.send(`**${cmd.name}** - info:\n` + `${cmd.aliases.length > 0 ? `Aliases: *${cmd.aliases.join(', ')}*\n` : ''}\n${cmd.help ? cmd.help : 'no help provided'}`)
			return
		}

		var map = cmd => `**${cmd.name}** ${cmd.aliases.length > 0 ? `*(${cmd.aliases.join(', ')})*` : ''} - ${cmd.desc ? cmd.desc : 'no description provided'}`

		let multicommands = commands.text.filter(cmd => cmd.categories).map(map)
		let textCommands = commands.text.filter(cmd => !cmd.categories).map(map)

		var embed = new MessageEmbed()
			.setTitle('**Available commands:**')
			.setColor(0x00ff00)
			.setDescription(`Some commands can only be used in server text chat or DM\n${msg.client.user.username} will not try to execute the command unless it can respond to the channel from which it was called`)
			.setFooter(`Type '${msg.guild ? config[msg.guild.id].prefix : ''}help command' for detailed help with 'command'`)
			.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
			.addField('\u200b', '\u200b')

		if (multicommands.join('\n').length < 1024) {
			embed.addField('**DM and text chat commands:**', multicommands.join('\n'))
		} else {
			let string = ''
			var i = 1
			for (let command of multicommands) {
				if ((string + '\n' + command).length < 1024) string += '\n' + command
				else {
					embed.addField(`**DM and text chat commands ${i++}:**`, string)
					string = command
				}
			}
			if (string.length > 0) embed.addField(`**DM and text chat commands ${i++}:**`, string)
		}

		embed.addField('\u200b', '\u200b')

		if (textCommands.join('\n').length < 1024) {
			embed.addField('**Text chat commands:**', textCommands.join('\n'))
		} else {
			let string = ''
			var i = 1
			for (let command of textCommands) {
				if ((string + '\n' + command).length < 1024) string += '\n' + command
				else {
					embed.addField(`**Text chat commands ${i++}:**`, string)
					string = command
				}
			}
			if (string.length > 0) embed.addField(`**Text chat commands ${i++}:**`, string)
		}

		if (canDoEmbed) msg.channel.send({ embeds: [embed] })
		else msg.channel.send('__**Allowing bot to send Embed links is recommended for better formatting of messages**__' + '**Available commands:**\n' + `Some commands can only be used in server text chat or DM\n${msg.client.user.username} will not try to execute the command unless it can respond to the channel from which it was called\n\n` + '**DM and text chat commands:\n**' + multicommands.join('\n') + '**\nText chat commands:**\n' + textCommands.join('\n') + `\nType '${msg.guild ? config[msg.guild.id].prefix : ''}help command' for detailed help with 'command'`)
	},
}
