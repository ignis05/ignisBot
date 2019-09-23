var { fetchCommands, config } = require('../res/Helpers.js')
const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'help',
	aliases: ['man'],
	categories: ['text', 'dm'],
	desc: 'Provides help and info about commands and functions',
	help: '`help` - displays list of all commands\n\n`help [command]` - provides info about specific command',
	run: msg => {
		console.log('generating help'.accent)
		let commands = fetchCommands(false)

		if (msg.content.split(' ').length > 1) {
			let command = msg.content.split(' ')[1]
			console.log('searching for command ' + command)
			let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
			console.log(`${cmd ? 'found' : 'not found'}`)
			if (!cmd) return
			var embed = new RichEmbed()
				.setTitle(`**${cmd.name}** - info:`)
				.setColor(cmd.categories ? 0xff00ff : 0x00ffff)
				.setDescription(`${cmd.aliases.length > 0 ? `Aliases: *${cmd.aliases.join(', ')}*\n` : ''}\n${cmd.help ? cmd.help : 'no help provided'}`)
				.setThumbnail(msg.client.user.displayAvatarURL)
			msg.channel.send(embed)
			return
		}

		var map = cmd => `**${cmd.name}** ${cmd.aliases.length > 0 ? `*(${cmd.aliases.join(', ')})*` : ''} - ${cmd.desc ? cmd.desc : 'no description provided'}`

		let multicommands = commands.text.filter(cmd => cmd.categories).map(map)
		let textCommands = commands.text.filter(cmd => !cmd.categories).map(map)

		var embed = new RichEmbed()
			.setTitle('**Available commands:**')
			.setColor(0x00ff00)
			.setDescription('Some commands can only be used in server text chat or DM')
			.addBlankField()
			.addField('**DM and text chat commands:**', multicommands.join('\n'))
			.addBlankField()
			.addField('**Text chat commands:**', textCommands.join('\n'))
			.setThumbnail(msg.client.user.displayAvatarURL)
			.setFooter(`Type '${msg.guild ? config[msg.guild.id].prefix : ''}help command' for detailed help with 'command'`)
		msg.channel.send(embed)
	},
}
