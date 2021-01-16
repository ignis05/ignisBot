var { formatTime } = require('../../res/Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const ytpl = require('ytpl')
const { MessageEmbed, Collection } = require('discord.js')
const PLAYLIST_LIMIT = 50

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

		if (queueContruct.songs.length > PLAYLIST_LIMIT) {
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
			let totalLength = serverQueue.songs.reduce((reducer, song) => (reducer += song.length), 0)
			var embed = new MessageEmbed().setTitle('**Song added to queue**').setColor(0x00ff00).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', formatTime(song.length), true).addField('Total playlist length', formatTime(totalLength), true)
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
			var filter = filters.get('Type').get('Video')
			const search = await ytsr(filter.url, { limit: 1 }).catch(err => {})
			if (!search || search.items.length < 1) {
				console.log('YT search failed')
				return resolve(null)
			}

			const item = search.items[0]
			// console.log(item)

			song = {
				title: item.title,
				url: item.url,
				length: parseFloat(item.duration),
				thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
			}
		} else {
			song = {
				title: songInfo.videoDetails.title,
				url: songInfo.videoDetails.video_url,
				length: parseFloat(songInfo.videoDetails.lengthSeconds),
				thumbnail: `https://i.ytimg.com/vi/${songInfo.videoDetails.videoId}/hqdefault.jpg`,
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

		var reduceFunc = (acc, song, i) => acc + `${i} - [${song.title}](${song.url}) [${formatTime(song.length)}] - requested by ${song.user}\n`

		var str = serverQueue.songs.reduce(reduceFunc, '')
		embed.addField('Queue', str)
		let totalLength = serverQueue.songs.reduce((reducer, song) => (reducer += song.length), 0)
		embed.addField('Total queue length', formatTime(totalLength))
		msg.channel.send(embed).catch(err => {
			if (err.code == 50035) {
				console.log('queue too long - sending short version')
				var embed2 = new MessageEmbed().setTitle('**Song queue**').setColor(0x0000ff)

				var length = 1024
				var i = 0
				var firstFew = ''
				for (let song of serverQueue.songs) {
					let s = reduceFunc('', song, i)
					length -= s.length
					i++
					if (length <= 0) break
					firstFew += s
				}

				embed2.addField(`Queue too long`, `Queue is too long to send in one message - logging first ${i} songs instead`).addField('Queue', firstFew).addField('Total queue length', formatTime(totalLength)).addField(`Total songs in queue`, `${serverQueue.songs.length}`)
				msg.channel.send(embed2).catch(err => console.error(err))
			} else console.error(err)
		})
	}
}

module.exports = {
	name: 'music',
	aliases: ['voice', 'song', 'm'],
	desc: `used to play music from youtube`,
	help: '`music play <link / url>` - plays music from specified url or fetches first search result\nIf music is already playing adds it to queue instead.\n`music playlist` - adds songs from youtube playlist to queue\n`music queue` - shows current song queue\n`music skip [n]` - skips n-th song from playlist. If no valid n is given skips currently playing song\n`music stop` - leaves voice channel and deletes queue\n`music playnow <link / url>` - Adds song to the front of the queue and skips current song\n`music shuffle` - radomly shuffles songs in playlist\n`music switch` - Updates selected voice channel and text channel\n`music earrape <link / url>` - like "voice playnow" but louder\n\nBot will automatically leave channel once queue is emptied.',
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
			case 'list':
			case 'playlist':
				let playlisturl = msg.content
					.split(' ')
					.filter(arg => arg != '')
					.slice(2)
					.join(' ')

				var playlist = await ytpl(playlisturl, { limit: serverQueue ? PLAYLIST_LIMIT - serverQueue.songs.length : PLAYLIST_LIMIT }).catch(err => console.log('Failed to resolve queue'))
				if (!playlist || !playlist.items || playlist.items.length < 2) return msg.channel.send('Failed to resolve queue')

				var s1 = playlist.items.shift()

				var song1 = {
					title: s1.title,
					url: s1.shortUrl,
					length: parseFloat(s1.durationSec),
					thumbnail: `https://i.ytimg.com/vi/${s1.id}/hqdefault.jpg`,
					user: msg.author,
				}

				if (!serverQueue) {
					var song = song1

					const voiceChannel = msg.member.voice.channel
					if (!voiceChannel) return msg.channel.send('You need to be in a voice channel to play music')
					const permissions = voiceChannel.permissionsFor(msg.client.user)
					if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
						return msg.channel.send("I don't have permissions CONNECT and SPEAK in this voice channel")
					}

					const queueContruct = {
						textChannel: msg.channel,
						voiceChannel: voiceChannel,
						connection: null,
						songs: [],
						playing: true,
					}

					queue.set(msg.guild.id, queueContruct)

					if (queueContruct.songs.length > PLAYLIST_LIMIT) {
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
				}

				var newServerQueue = queue.get(msg.guild.id)

				for (let s0 of playlist.items) {
					var song = {
						title: s0.title,
						url: s0.shortUrl,
						length: parseFloat(s0.durationSec),
						thumbnail: `https://i.ytimg.com/vi/${s0.id}/hqdefault.jpg`,
						user: msg.author,
					}

					newServerQueue.songs.push(song)
				}

				if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
					msg.channel.send(`${playlist.title} has been added to the queue!`)
				} else {
					let totalLength = newServerQueue.songs.reduce((reducer, song) => (reducer += song.length), 0)
					var embed = new MessageEmbed().setTitle('**Playlist added to queue**').setColor(0x00ff00).setImage(song1.thumbnail).addField('Title', playlist.title, true).addField('Url', playlist.url, true).addField('Total playlist length', formatTime(totalLength), true)
					msg.channel.send(embed)
				}

				break

			default:
				msg.channel.send('Command unknown - use `!help voice` to see available commands')
				break
		}
	},
}
