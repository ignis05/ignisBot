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

		let canDoEmbed = msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')

		let commands = fetchCommands(false)

		if (msg.content.split(' ').filter(arg => arg != '').length > 1) {
			let command = msg.content.split(' ').filter(arg => arg != '')[1]
			console.log('searching for command ' + command)
			let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
			console.log(`${cmd ? 'found' : 'not found'}`)
			if (!cmd) return
			var embed = new MessageEmbed()
				.setTitle(`**${cmd.name}** - info:`)
				.setColor(cmd.categories ? 0xff00ff : 0x00ffff)
				.setDescription(`${cmd.aliases.length > 0 ? `Aliases: *${cmd.aliases.join(', ')}*\n` : ''}\n${cmd.help ? cmd.help : 'no help provided'}`)
				.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
			if (canDoEmbed) msg.channel.send(embed)
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
			.addField('\u200b', '\u200b')
			.addField('**DM and text chat commands:**', multicommands.join('\n'))
			.addField('\u200b', '\u200b')
			.addField('**Text chat commands:**', textCommands.join('\n'))
			.setThumbnail(msg.client.user.displayAvatarURL({ format: 'png' }))
			.setFooter(`Type '${msg.guild ? config[msg.guild.id].prefix : ''}help command' for detailed help with 'command'`)
		if (canDoEmbed) msg.channel.send(embed)
		else msg.channel.send('__**Allowing bot to send Embed links is recommended for better formatting of messages**__' + '**Available commands:**\n' + `Some commands can only be used in server text chat or DM\n${msg.client.user.username} will not try to execute the command unless it can respond to the channel from which it was called\n\n` + '**DM and text chat commands:\n**' + multicommands.join('\n') + '**\nText chat commands:**\n' + textCommands.join('\n') + `\nType '${msg.guild ? config[msg.guild.id].prefix : ''}help command' for detailed help with 'command'`)
	},
}
