var { formatTime } = require('../../res/Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const { MessageEmbed } = require('discord.js')

const queue = new Map()

async function execute(msg, serverQueue) {
	var args = msg.content.split(' ')
	args.shift()
	args.shift()
	var songarg = args.join(' ')

	const voiceChannel = msg.member.voice.channel
	if (!voiceChannel) return msg.channel.send('You need to be in a voice channel to play music')
	const permissions = voiceChannel.permissionsFor(msg.client.user)
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.channel.send("I don't have permissions CONNECT and SPEAK in this voice channel")
	}

	const songInfo = await ytdl.getBasicInfo(songarg).catch(err => {})

	var song

	if (!songInfo) {
		const search = await ytsr(songarg, { limit: 1 }).catch(err => {})
		if (search.items.length < 1) return

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

	if (!serverQueue) {
		const queueContruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
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

function skip(msg, serverQueue) {
	if (!msg.member.voice.channel) return msg.channel.send('You have to be in a voice channel to skip the music')
	if (!serverQueue) return msg.channel.send('Queue is already empty')
	let nr = parseInt(msg.content.split(' ')[2])
	if (!isNaN(nr) && serverQueue.songs[nr] != undefined) {
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
}

function stop(msg, serverQueue) {
	msg.channel.send('Manually diconnected.')
	serverQueue.songs = []
	serverQueue.connection.dispatcher.end()
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
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
	if (!serverQueue.textChannel.permissionsFor(guild.me).has('EMBED_LINKS')) {
		serverQueue.textChannel.send(`Now playing: **${song.title}**`)
	} else {
		var embed = new MessageEmbed().setTitle('**Now playing**').setColor(0x00ffff).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true)
		serverQueue.textChannel.send(embed)
	}
}

function list(msg, serverQueue) {
	if (!serverQueue) {
		msg.channel.send('Queue is empty')
		return
	}
	if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
		msg.channel.send('```' + JSON.stringify(serverQueue.songs, null, 4) + '```')
	} else {
		var embed = new MessageEmbed().setTitle('**Song queue**').setColor(0x0000ff)
		var i = 0
		for (let song of serverQueue.songs) {
			embed.addField(`${i} - '${song.title}' [${song.length}]`, `${song.url}\n`)
			i++
		}
		msg.channel.send(embed)
	}
}

module.exports = {
	name: 'voice',
	aliases: ['music', 'song'],
	desc: `used to play music from youtube`,
	help: '`voice play <link / url>` - plays music from specified url or fetches first search result\nIf music is already playing adds it to queue instead.\n`voice queue` - shows current song queue\n`voice skip [n]` - skips n-th song from playlist. If no valid n is given skips currently playing song\n`voice stop` - leaves voice channel and deletes queue\n\nBot will automatically leave channel once queue is emptied.',
	run: async msg => {
		let args = msg.content.split(' ')
		args.shift()
		const serverQueue = queue.get(msg.guild.id)
		switch (args[0]) {
			case 'play':
				execute(msg, serverQueue)
				break
			case 'skip':
				skip(msg, serverQueue)
				break
			case 'stop':
			case 'kys':
			case 'leave':
				stop(msg, serverQueue)
				break
			case 'queue':
			case 'list':
				list(msg, serverQueue)
				break
		}
	},
}
