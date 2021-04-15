var { saveConfig, config } = require('../../res/Helpers.js')
const { getStatus } = require('mc-server-status')
const { MessageEmbed, MessageAttachment } = require('discord.js')

module.exports = {
	name: 'mc',
	aliases: ['ms', 'minecraft'],
	desc: `Allows to check minecraft server status`,
	help: '`mc <url / name>` - Checks status of server using given url or saved name\n\n`mc list` - lists saved servers\n\n`mc add <name> <url>` - saves server url under short name (or updates url of exisitng saved server)\n\n`mc del <name>` - removes saved server',
	run: async msg => {
		const urlRegex = /^(\S+\.\S+|\d+\.\d+\.\d+\.\d+)(:\d+)?$/gm
		function mcStringFromat(s) {
			let out = s.text
			if (s.extra) out += s.extra.reduce((reducer, a) => reducer + a.text, '')
			return out
		}
		async function testConn(url) {
			const status = await getStatus(url).catch(err => {
				if (err.toString().startsWith('Error: getaddrinfo ENOTFOUND')) {
					// invalid url
					msg.channel.send('Could not resolve serer address.')
				}
			})
			var embed = new MessageEmbed().setTitle('**Minecraft Server Status:**').setDescription('This server is currently **offline**').setColor(0xff0000).addField('Address', url)
			if (status) {
				embed
					.setColor(0x00ff00)
					.setDescription('This server is currently **online**')
					.addField('Players', `${status.players.online} / ${status.players.max}`)
					.addField('Status', `${mcStringFromat(status.description)}`)
					.addField('Version', `${status.version.name}`)
				if (status.favicon) {
					var base64Data = status.favicon.replace(/^data:image\/png;base64,/, '')
					const imageStream = Buffer.from(base64Data, 'base64')
					const attachment = new MessageAttachment(imageStream, 'icon.png')
					embed.attachFiles([attachment]).setThumbnail('attachment://icon.png')
				}
			}
			msg.channel.send(embed)
		}

		if (!config[msg.guild.id].mc_servers) {
			config[msg.guild.id].mc_servers = {}
			saveConfig()
		}
		const mc_servers = config[msg.guild.id].mc_servers

		const arg = msg.content.split(' ').filter(arg => arg != '')[1]
		switch (arg) {
			case 'list':
				msg.channel.send(JSON.stringify(mc_servers))
				break
			case 'add':
				var name = msg.content.split(' ').filter(arg => arg != '')[2]
				var url = msg.content.split(' ').filter(arg => arg != '')[3]
				if (!name || !url) return msg.reply('Please specify name and url')
				if (!name.match(/^\w+$/) || name == 'add' || name == 'list' || name == 'del') return msg.reply('Invalid name')
				if (!url.match(urlRegex)) return msg.reply('Invalid url')
				mc_servers[name] = url
				await saveConfig()
				msg.reply(`Added *${name}* to saved servers`)
				break
			case 'del':
				var name = msg.content.split(' ').filter(arg => arg != '')[2]
				if (!name) return msg.reply('Please specify server name')
				if (!mc_servers[name]) return msg.reply("Name doesn't match any saved servers")
				delete mc_servers[name]
				msg.reply(`Removed *${name}* from saved servers`)
				break
			default:
				if (!arg) {
					msg.reply('No arguments. Try `!help ms`')
					break
				}

				// no embed
				if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
					return msg.channel.send('Enable `embed messages` permission to use this command')
				}

				// raw url
				if (arg.match(urlRegex)) {
					console.log('recognized as url')
					testConn(arg)
					return
				}

				// saved server
				if (mc_servers[arg]) {
					console.log('recognized from list')
					testConn(mc_servers[arg])
					return
				}

				msg.channel.send('Unrecognized server')

				break
		}
	},
}
