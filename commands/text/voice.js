var { formatTime } = require('../../res/Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')

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

		queueContruct.songs.push(song)

		try {
			var connection = await voiceChannel.join()
			queueContruct.connection = connection
			play(msg, queueContruct.songs[0])
		} catch (err) {
			console.log(err)
			queue.delete(msg.guild.id)
			return msg.channel.send(err)
		}
	} else {
		serverQueue.songs.push(song)
		return msg.channel.send(`${song.title} has been added to the queue!`)
	}
}

function skip(msg, serverQueue) {
	if (!msg.member.voice.channel) return msg.channel.send('You have to be in a voice channel to skip the music')
	if (!serverQueue) return msg.channel.send('Queue is already empty')
	serverQueue.connection.dispatcher.end()
}

function stop(msg, serverQueue) {
	msg.channel.send('Disconnecting')
	serverQueue.songs = []
	serverQueue.connection.dispatcher.end().catch(() => {
		serverQueue.connection.disconnect()
	})
}

function play(msg, song) {
	const serverQueue = queue.get(msg.guild.id)
	if (!song) {
		msg.channel.send('Queue finished. Disconnecting.')
		serverQueue.voiceChannel.leave()
		queue.delete(msg.guild.id)
		return
	}

	const dispatcher = serverQueue.connection
		.play(ytdl(song.url))
		.on('finish', () => {
			serverQueue.songs.shift()
			play(msg, serverQueue.songs[0])
		})
		.on('error', error => console.error(error))
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
	serverQueue.textChannel.send(`Now playing: **${song.title}**`)
}

function list(msg, serverQueue) {
	console.log(serverQueue.songs)
	if (!serverQueue) {
		msg.channel.send('Queue is empty')
		return
	}
	msg.channel.send('```' + JSON.stringify(serverQueue.songs, null, 4) + '```', { embed: null })
}

module.exports = {
	name: 'voice',
	aliases: ['music', 'song'],
	desc: `used to play music from youtube`,
	help: '`voice play <link / url>` - plays music from specified url or fetches first search result\nIf music is already playing adds it to queue instead.\n`voice skip` - skips current song\n`voice stop` - leaves voice channel and deletes queue\n\nBot will automatically leave channel once queue is emptied.',
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
