let config = require('../../data/config.json')

module.exports = {
	name: 'guildconfig',
	aliases: ['guildsettings', 'guild'],
	run: msg => {
		let arg = msg.content
			.split(' ')
			.slice(1)
			.filter(a => a != '')
			.join(' ')
		if (arg === 'all') return msg.channel.send('```' + JSON.stringify(config, null, 3) + '```')
		const guildConfig = config[arg] || config[msg.guild.id]
		msg.channel.send('```' + JSON.stringify(guildConfig, null, 3) + '```')
	},
}
