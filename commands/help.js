var { fetchCommands, config } = require('../res/Helpers.js')
const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'help',
	aliases: ['man'],
	categories: ['text', 'dm'],
	run: msg => {
		console.log('generating help'.accent)
		let commands = fetchCommands(false)

		if (msg.content.split(' ').length > 1) {
			let command = msg.content.split(' ')[1]
			console.log('searching for command' + command)
			let cmd = commands.text.find(cmd => cmd.name == command || cmd.aliases.includes(command))
			console.log(`${cmd ? 'found' : 'not found'}`)
			if (!cmd) return
			var embed = new RichEmbed()
				.setTitle(`**${cmd.name}** - help:`)
				.setColor(0x0000ff)
				.setDescription(`${cmd.aliases.length > 0 ? `*(${cmd.aliases.join(', ')})*\n` : ''} ${cmd.help ? cmd.help : 'no help provided'}`)
				.setThumbnail(msg.client.user.displayAvatarURL)
			msg.channel.send(embed)
			return
		}

		let allCommands = commands.text.map(cmd => `**${cmd.name}** ${cmd.aliases.length > 0 ? `*(${cmd.aliases.join(', ')})*` : ''} - ${cmd.desc ? cmd.desc : 'no description provided'}`)

		var embed = new RichEmbed()
			.setTitle('**Available commands:**')
			.setColor(0x00ff00)
			.setDescription(allCommands.join('\n'))
			.setThumbnail(msg.client.user.displayAvatarURL)
			.setFooter(`Type '${config[msg.guild.id].prefix}help command' for detailed help with 'command'`)
		msg.channel.send(embed)
	},
}
