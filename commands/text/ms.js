var { saveConfig, config } = require('../../res/Helpers.js')
var request = require('request')
const { MessageEmbed, MessageAttachment } = require('discord.js')

module.exports = {
	name: 'ms',
	aliases: ['mc', 'minecraft'],
	desc: `Allows to check minecraft server status`,
	help: '`ms <url / name>` - Checks status of server using given url or saved name\n\n`ms list` - lists saved servers\n\n`ms add <name> <url>` - saves server url under short name (or updates url of exisitng saved server)\n\n`ms del <name>` - removes saved server',
	run: async msg => {
		const urlRegex = /^(\S+\.\S+|\d+\.\d+\.\d+\.\d+)(:\d+)?$/gm
		function testConn(url) {
			let tmp = url.split(':')
			let mcIP = tmp[0]
			let mcPort = parseInt(tmp[1]) || 25565
			request('http://mcapi.us/server/status?ip=' + mcIP + '&port=' + mcPort, function (err, response, body) {
				if (err) {
					console.log(err)
					msg.channel.send('Error getting Minecraft server status...')
					return
				}
				body = JSON.parse(body)
				var embed = new MessageEmbed().setTitle('**Minecraft Server Status:**').setDescription('This server is currently **offline**').setColor(0xff0000).addField('Address', url)
				if (body.online) {
					embed
						.setColor(0x00ff00)
						.setDescription('This server is currently **online**')
						.addField('Status', `${body.motd}`)
						.addField('Players', `${body.players.now} / ${body.players.max}`)
						.setFooter(`Online since ${new Date(Date.now() - body.last_online)}`)
					if (body.favicon) {
						const imageStream = Buffer.from(body.favicon, 'base64')
						const attachment = new MessageAttachment(imageStream, 'icon.png')
						embed.attachFiles([attachment]).setThumbnail('attachment://icon.png')
					}
				}
				msg.channel.send(embed)
			})
		}

		if (!config[msg.guild.id].mc_servers) {
			config[msg.guild.id].mc_servers = {}
			saveConfig()
		}
		const mc_servers = config[msg.guild.id].mc_servers

		const arg = msg.content.split(' ')[1]
		switch (arg) {
			case 'list':
				msg.channel.send(JSON.stringify(mc_servers))
				break
			case 'add':
				var name = msg.content.split(' ')[2]
				var url = msg.content.split(' ')[3]
				if (!name || !url) return msg.reply('Please specify name and url')
				if (!name.match(/^\w+$/) || name == 'add' || name == 'list' || name == 'del') return msg.reply('Invalid name')
				if (!url.match(urlRegex)) return msg.reply('Invalid url')
				mc_servers[name] = url
				await saveConfig()
				msg.reply(`Added *${name}* to saved servers`)
				break
			case 'del':
				var name = msg.content.split(' ')[2]
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
