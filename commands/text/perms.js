var { checkPerms, saveConfig, config } = require('../../res/Helpers.js')
const { RichEmbed } = require('discord.js')

module.exports = {
	name: 'perms',
	desc: `manages access to bot's functionality`,
	help: "`perms list` - displays permissions list\n\n`perms <add / del> @mention [permission1, permission2, ...]` - adds / removes specified user's permissions\n\n",
	run: msg => {
		var command = msg.content.split(' ')
		if (!checkPerms(msg.author.id, 'admin', msg.guild.id)) {
			msg.reply('You dont have permission to use this command!')
			return
		}
		let canDoEmbed = msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')
		if (!canDoEmbed) {
			console.log('no embed permission'.red)
			msg.channel.send("I don't have permission 'embed links' on this channel")
			return
		}
		switch (command[1]) {
			case 'list':
				var list = ''
				for (var i in config[msg.guild.id].perms) {
					list += `\n__${i}:__`
					for (var j in config[msg.guild.id].perms[i]) {
						list += `\n - ${config[msg.guild.id].perms[i][j].name}`
					}
				}
				var embed = new RichEmbed()
					.setTitle('Permissions list:')
					.setColor(0xff0000)
					.setDescription(list)
				msg.channel.send(embed)
				break
			case 'add':
				var uID = msg.mentions.users.firstKey()
				console.log(uID)
				var perms = command.slice(3)
				perms = perms.filter(perm => perm != '' && perm != ' ')
				if (!perms) break
				console.log(`user: ${uID}, perms: `, perms)

				for (var i in perms) {
					if (perms[i] == 'admin') {
						//if someone tires to give admin perm -- extra check if me
						if (!checkPerms(msg.author.id, 'ignis', msg.guild.id)) {
							msg.channel.send('only bot owner can grant admin permission')
							continue
						}
					}
					if (!Object.keys(config[msg.guild.id].perms).includes(perms[i])) {
						console.log('invalid perm'.yellow)
						msg.channel.send(`${perms[i]} is invalid perm!`)
						continue
					}
					if (!config[msg.guild.id].perms[perms[i]].find(p => p.id == uID)) {
						config[msg.guild.id].perms[perms[i]].push({
							name: msg.guild.members.get(uID).user.username,
							id: uID,
						})
						saveConfig(msg.channel, 'success!')
					} else {
						msg.channel.send('user already has this permission')
					}
				}
				break
			case 'del':
			case 'remove':
			case 'delete':
				var uID = command[2].slice(2, -1)
				var perms = command.slice(3)
				if (!perms) break
				console.log(`user: ${uID}, perms: `, perms)

				for (var i in perms) {
					if (perms[i] == 'admin') {
						//if someone tires to remove admin perm -- extra check if me
						if (!checkPerms(msg.author.id, 'ignis', msg.guild.id)) {
							msg.channel.send('only bot owner can remove admin permission')
							continue
						}
					}
					if (!Object.keys(config[msg.guild.id].perms).includes(perms[i])) {
						console.log('invalid perm'.yellow)
						msg.channel(`${perms[i]} is invalid perm!`)
						continue
					}

					if (config[msg.guild.id].perms[perms[i]].find(p => p.id == uID)) {
						for (let z in config[msg.guild.id].perms[perms[i]]) {
							if (config[msg.guild.id].perms[perms[i]][z].id == uID) {
								config[msg.guild.id].perms[perms[i]].splice(z, 1)
								saveConfig(msg.channel, 'success!')
								break
							}
						}
						console.log(config[msg.guild.id])
					} else {
						msg.channel.send("user doesn't have this permission")
					}
				}
				break
		}
	},
}
