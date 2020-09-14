var { formatTime } = require('../../res/Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const { MessageEmbed, Collection } = require('discord.js')

const queue = new Collection()

async function execute(msg, serverQueue, volume) {
	var songarg = msg.content
		.split(' ')
		.filter(arg => arg != '')
		.slice(2)
		.join(' ')

	const voiceChannel = msg.member.voice.channel
	if (!voiceChannel) return msg.channel.send('You need to be in a voice channel to play music')
	const permissions = voiceChannel.permissionsFor(msg.client.user)
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.channel.send("I don't have permissions CONNECT and SPEAK in this voice channel")
	}

	var song = await fetchYT(songarg)
	if (!song) {
		return msg.channel.send('No matching results found')
	}
	song.user = msg.author
	song.volume = volume

	if (!serverQueue) {
		const queueContruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			playing: true,
		}

		queue.set(msg.guild.id, queueContruct)

		if (queueContruct.songs.length > 20) {
			msg.channel.send('Queue is full')
			return
		}

		queueContruct.songs.push(song)

		try {
			var connection = await voiceChannel.join()
			queueContruct.connection = connection
			play(msg.guild, queueContruct.songs[0])
		} catch (err) {
			console.log(err)
			queue.delete(msg.guild.id)
			return msg.channel.send(err)
		}
	} else {
		serverQueue.songs.push(song)
		if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
			msg.channel.send(`${song.title} has been added to the queue!`)
		} else {
			var embed = new MessageEmbed().setTitle('**Song added to queue**').setColor(0x00ff00).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true)
			msg.channel.send(embed)
		}
	}
}

function fetchYT(resolvable) {
	return new Promise(async (resolve, reject) => {
		const songInfo = await ytdl.getBasicInfo(resolvable).catch(err => {
			console.log('Url fetch failed')
		})

		var song

		if (!songInfo) {
			const filters = await ytsr.getFilters(resolvable)
			var filter = filters.get('Type').find(o => o.name === 'Video')
			const search = await ytsr(resolvable, { limit: 1, nextpageRef: filter.ref }).catch(err => {})
			if (!search || search.items.length < 1) {
				console.log('YT search failed')
				return resolve(null)
			}

			const item = search.items[0]
			console.log(item)

			song = {
				title: item.title,
				url: item.link,
				length: item.duration,
				thumbnail: item.thumbnail.split('?')[0],
			}
		} else {
			song = {
				title: songInfo.title,
				url: songInfo.video_url,
				length: formatTime(songInfo.length_seconds),
				thumbnail: `https://i.ytimg.com/vi/${songInfo.video_id}/hqdefault.jpg`,
			}
		}

		console.log(song)
		resolve(song)
	})
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id)
	if (!song) {
		serverQueue.textChannel.send('Queue finished. Disconnecting.')
		serverQueue.voiceChannel.leave()
		queue.delete(guild.id)
		return
	}

	const dispatcher = serverQueue.connection
		.play(ytdl(song.url))
		.on('finish', () => {
			serverQueue.songs.shift()
			play(guild, serverQueue.songs[0])
		})
		.on('error', error => console.error(error))
	dispatcher.setVolumeLogarithmic(song.volume || 1)
	if (!serverQueue.textChannel.permissionsFor(guild.me).has('EMBED_LINKS')) {
		serverQueue.textChannel.send(`Now playing: **${song.title}**`)
	} else {
		var embed = new MessageEmbed().setTitle('**Now playing**').setColor(0x00ffff).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true).addField('Requested by', song.user.toString(), true)
		serverQueue.textChannel.send(embed)
	}
}

function list(serverQueue, msg) {
	if (!serverQueue) {
		msg.channel.send('Queue is empty')
		return
	}
	if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
		msg.channel.send('```' + JSON.stringify(serverQueue.songs, null, 4) + '```')
	} else {
		var embed = new MessageEmbed().setTitle('**Song queue**').setColor(0x0000ff)
		var str = serverQueue.songs.reduce((acc, song, i) => acc + `${i} - [${song.title}](${song.url}) [${song.length}] - requested by ${song.user}\n`, '')
		embed.addField('Queue', str)
		msg.channel.send(embed)
	}
}

module.exports = {
	name: 'voice',
	aliases: ['music', 'song'],
	desc: `used to play music from youtube`,
	help: '`voice play <link / url>` - plays music from specified url or fetches first search result\nIf music is already playing adds it to queue instead.\n`voice queue` - shows current song queue\n`voice skip [n]` - skips n-th song from playlist. If no valid n is given skips currently playing song\n`voice stop` - leaves voice channel and deletes queue\n`voice playnow <link / url>` - Adds song to the front of the queue and skips current song\n`voice shuffle` - radomly shuffles songs in playlist\n`voice switch` - Updates selected voice channel and text channel\n`voice earrape <link / url>` - like "voice playnow" but louder\n\nBot will automatically leave channel once queue is emptied.',
	run: async msg => {
		let args = msg.content.split(' ').filter(arg => arg != '')
		args.shift()
		const serverQueue = queue.get(msg.guild.id)
		switch (args[0]) {
			case 'play':
				execute(msg, serverQueue)
				break
			case 'skip':
				if (!msg.member.voice.channel) return msg.channel.send('You have to be in a voice channel to skip the music')
				if (!serverQueue) return msg.channel.send('Queue is already empty')
				let nr = parseInt(msg.content.split(' ').filter(arg => arg != '')[2])
				if (nr !== 0 && !isNaN(nr) && serverQueue.songs[nr] != undefined) {
					serverQueue.songs.splice(nr, 1)

					if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
						msg.channel.send('```Skipped song ' + nr + '\n' + JSON.stringify(serverQueue.songs, null, 4) + '```')
					} else {
						var embed = new MessageEmbed().setTitle(`**Skipped song ${nr}**`).setColor(0x0000ff)
						var i = 0
						for (let song of serverQueue.songs) {
							embed.addField(`${i} - '${song.title}' [${song.length}]`, `${song.url}\n`)
							i++
						}
						msg.channel.send(embed)
					}
				} else {
					serverQueue.connection.dispatcher.end()
				}
				break
			case 'stop':
			case 'kys':
			case 'leave':
				if (serverQueue) {
					msg.channel.send('Manually disconnected.')
					serverQueue.songs = []
					serverQueue.connection.dispatcher.end()
				} else {
					msg.channel.send('No server queue found. If bot is still connected it will leave automatically in a moment')
				}

				break
			case 'queue':
			case 'list':
			case 'playlist':
				list(serverQueue, msg)
				break
			case 'playnow':
			case 'forceplay':
				if (!serverQueue) {
					execute(msg, serverQueue)
				} else {
					let temp = msg.content
						.split(' ')
						.filter(arg => arg != '')
						.slice(2)
						.join(' ')
					fetchYT(temp).then(song => {
						if (!song) return msg.channel.send('No results found')
						song.user = msg.author
						let now = serverQueue.songs.shift()
						serverQueue.songs.unshift(song)
						serverQueue.songs.unshift(now)
						serverQueue.connection.dispatcher.end()
					})
				}
				break
			case 'search':
				let temp = msg.content
					.split(' ')
					.filter(arg => arg != '')
					.slice(2)
					.join(' ')
				fetchYT(temp).then(song => {
					if (!song) return msg.channel.send('No results found')
					if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
						msg.channel.send(`Search result: **${song.title}**`)
					} else {
						var embed = new MessageEmbed().setTitle('**Search result**').setColor(0x00ffff).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true)
						msg.channel.send(embed)
					}
				})
				break
			case 'shuffle':
				if (serverQueue) {
					let now = serverQueue.songs.shift()
					serverQueue.songs.sort(() => Math.random() - 0.5)
					serverQueue.songs.unshift(now)
					list(serverQueue, msg)
				} else {
					msg.channel.send('Queue is empty')
				}
				break
			case 'switch':
			case 'channel':
				if (!serverQueue) return msg.channel.send('Bot is not playing anything')
				if (!msg.member.voice.channel) return msg.channel.send('You have to be in a voice channel to use this')
				const permissions = msg.member.voice.channel.permissionsFor(msg.client.user)
				if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
					return msg.channel.send("I don't have permissions CONNECT and SPEAK in this voice channel")
				}
				msg.member.voice.channel.join()
				serverQueue.voiceChannel = msg.member.voice.channel
				serverQueue.textChannel = msg.channel
				break
			case 'earrape':
				if (!serverQueue) {
					execute(msg, serverQueue, 100)
				} else {
					let temp = msg.content
						.split(' ')
						.filter(arg => arg != '')
						.slice(2)
						.join(' ')
					fetchYT(temp).then(song => {
						if (!song) return msg.channel.send('No results found')
						song.user = msg.author
						song.volume = 100
						let now = serverQueue.songs.shift()
						serverQueue.songs.unshift(song)
						serverQueue.songs.unshift(now)
						serverQueue.connection.dispatcher.end()
					})
				}
				break
			default:
				msg.channel.send('Command unknown - use `!help voice` to see available commands')
				break
		}
	},
}
