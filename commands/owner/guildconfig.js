var { config } = require('../../res/Helpers.js')

module.exports = {
	name: 'guildconfig',
	aliases: ['guildsettings', 'guild'],
	run: msg => {
		let arg = msg.content
			.split(' ')
			.slice(1)
			.filter(a => a != '')
			.join(' ')
		if (arg === '' && !msg.guild) return msg.channel.send("No guild id specified. Use 'all' to list all guilds")
		if (arg === 'all') return msg.channel.send('```' + JSON.stringify(config, null, 3) + '```')
		const guildConfig = config[arg] || config[msg.guild.id]
		msg.channel.send('```' + JSON.stringify(guildConfig, null, 3) + '```')
	},
}
