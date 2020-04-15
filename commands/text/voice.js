const ytdl = require('ytdl-core')
const ytsr = require('ytsr')

const queue = new Map()

async function execute(message, serverQueue) {
	var args = message.content.split(' ')
	args.shift()
	args.shift()
	var songarg = args.join(' ')

	const voiceChannel = message.member.voice.channel
	if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music')
	const permissions = voiceChannel.permissionsFor(message.client.user)
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send("I don't have permissions CONNECT and SPEAK in this voice channel")
	}

	const songInfo = await ytdl.getBasicInfo(songarg).catch(err => {})

	console.log(songInfo)

	var song

	if (!songInfo) {
		const search = await ytsr(songarg, { limit: 1 }).catch(err => {})
		console.log(search)
		if (search.items.length < 1) return

		const item = search.items[0]

		song = {
			title: item.title,
			url: item.link,
			length: item.duration,
			thumbnail: item.thumbnail,
		}
	} else {
		song = {
			title: songInfo.title,
			url: songInfo.video_url,
			length: songInfo.length_seconds,
			thumbnail: songInfo.thumbnail_url,
		}
	}

	console.log(song)

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		}

		queue.set(message.guild.id, queueContruct)

		queueContruct.songs.push(song)

		try {
			var connection = await voiceChannel.join()
			queueContruct.connection = connection
			play(message.guild, queueContruct.songs[0])
		} catch (err) {
			console.log(err)
			queue.delete(message.guild.id)
			return message.channel.send(err)
		}
	} else {
		serverQueue.songs.push(song)
		return message.channel.send(`${song.title} has been added to the queue!`)
	}
}

function skip(message, serverQueue) {
	if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel to skip the music')
	if (!serverQueue) return message.channel.send('Queue is already empty')
	serverQueue.connection.dispatcher.end()
}

function stop(message, serverQueue) {
	message.channel.send('Disconnecting')
	serverQueue.songs = []
	serverQueue.connection.dispatcher.end()
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id)
	if (!song) {
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
	serverQueue.textChannel.send(`Now playing: **${song.title}**`)
}

module.exports = {
	name: 'voice',
	 aliases: ['music', 'song'],
	 desc: `used to play music from youtube`,
	 help: "`voice play <link / url>` - plays music from specified url or fetches first search result\nIf music is already playing adds it to queue instead.\n`voice skip` - skips current song\n`voice stop` - leaves voice channel and deletes queue\n\nBot will automatically leave channel once queue is emptied.",
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
		}
	},
}
