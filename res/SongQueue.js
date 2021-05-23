const { StreamDispatcher, VoiceChannel, VoiceConnection, TextChannel, MessageEmbed, GuildMember, ApplicationCommandOptionChoice } = require('discord.js')
const { formatTime } = require('./Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const ytpl = require('ytpl')

const PLAYLIST_LIMIT = 50

/**
 * @typedef {Object} Song
 * @property {String} title
 * @property {String} url
 * @property {String} length
 * @property {String} thumbnail
 * @property {GuildMember} user
 */

class SongQueue {
    // commands registered on guild when the queue is initialised
    musicGuildCommand = {
        name: 'music',
        description: 'Manages youtube playback functions - guild version',
        options: [
            {
                name: 'stop',
                type: 'SUB_COMMAND',
                description: 'Leaves the voice channel and deletes the queue.',
            },
            {
                name: 'queue',
                type: 'SUB_COMMAND',
                description: 'Displays current song queue.',
            },
            {
                name: 'skip',
                type: 'SUB_COMMAND',
                description: 'Removes song from playlist',
                options: [
                    {
                        name: 'position',
                        type: 'INTEGER',
                        description: "Which song to skip.",
                        required: true,
                        choices: []
                    }
                ]
            },
        ]
    }

    /**
     * Initializes queue and binds it to voice channel and guild
     * @param {VoiceChannel} voiceChannel 
     * @param {TextChannel} textChannel 
     */
    constructor(voiceChannel, textChannel) {
        console.log('creating new SongQueue')
        this.textChannel = textChannel
        this.voiceChannel = voiceChannel
        this.guild = voiceChannel.guild
        this.songs = []
        this.volume = 0.5
        this.isPlaying = false

        /**
        * @type {VoiceConnection} voiceConnection
        */
        this.voiceConnection = null
        /**
         * @type {StreamDispatcher} dispatcher
         */
        this.dispatcher = null

        /**
         * @type {Song} currentSong
         */
        this.currentSong = null

        this.registerQueueCommands()
    }


    /** 
     * Gets summed lenghts of all songs in queue
     * @returns {String} total length of all songs in the queue, in hh:mm:ss format
     */
    get totalPlayTime() {
        let totaltime = 0
        for (let song of this.mergedQueue) {
            var sLenSec = 0
            let durArr = song.length.split(':').reverse()
            for (let i in durArr) {
                i = parseInt(i)
                sLenSec += parseInt(durArr[i]) * (60 ** i)
            }
            console.log(sLenSec)
            totaltime += sLenSec
        }
        console.log(totaltime)
        return formatTime(totaltime)
    }

    /** 
     * Returns queue with currently played song in position 0
     * @returns {Song[]}
     */
    get mergedQueue() {
        let copy = [...this.songs]
        if (this.currentSong) copy.unshift(this.currentSong)
        return copy
    }

    /**
     * Adds song to queue
     * @param {String} query - yt link or serach query
     * @param {GuildMember} member - user who requested the song
     * @returns {Promise<Song>} song data
     */
    addToQueue(query, member) {
        return new Promise(async (resolve, reject) => {
            /**
            * @type {Song}
            */
            var song = await this.fetchSongData(query)
            if (!song) return reject('failed to fetch song')
            song.user = member
            this.songs.push(song)
            resolve(song)
            this.registerQueueCommands() // update skip choices
        })
    }

    /**
     * Adds playlist songs to queue
     * @param {String} query - yt playlist link
     * @param {GuildMember} member - user who requested the song
     * @returns {Promise<Object>} playlist data
     */
    addPlaylistToQueue(playlisturl, member) {
        return new Promise(async (resolve, reject) => {
            var playlist = await ytpl(playlisturl, { limit: PLAYLIST_LIMIT - this.songs.length }).catch(err => console.log('Failed to resolve queue'))
            if (playlist?.items?.length < 2) return reject('Failed to resolve queue')

            for (let s0 of playlist.items) {
                /**
                 * @type {Song}
                 */
                var song = {
                    title: s0.title,
                    url: s0.shortUrl,
                    length: formatTime(s0.durationSec),
                    thumbnail: `https://i.ytimg.com/vi/${s0.id}/hqdefault.jpg`,
                    user: member,
                }
                this.songs.push(song)
            }
            resolve(playlist)
            this.registerQueueCommands() // update skip choices
        })
    }

    /**
     * Destroys queue. 
     * Launches this.onDestroy(this.guild) if that function is registered.
     */
    async destroy() {
        console.log('destroying queue')
        if (this.voiceConnection) this.voiceChannel.leave()

        // call onDestroy function if its registered
        this.onDestroy?.(this.guild)

        // unregister commands
        let commands = await this.guild.commands.fetch()
        let musicCMD = commands.find(c => c.name == 'music')
        musicCMD.delete()
    }

    /**
     * Removes fist song from the queue and plays it through StreamDispatcher. 
     * If queue is empty calling this will launch this.destroy()
     */
    async playNext() {
        this.isPlaying = true

        /**
        * @type {Song}
        */
        var song = this.songs.shift()
        this.currentSong = song
        if (!song) {
            this.textChannel.send('Queue finished. Disconnecting.')
            this.destroy()
            return
        }

        this.dispatcher = this.voiceConnection
            .play(ytdl(song.url))
            .on('finish', () => {
                this.playNext()
            })
            .on('error', error => console.error(error))
        this.dispatcher.setVolumeLogarithmic(this.volume)
        if (!this.textChannel.permissionsFor(this.guild.me).has('EMBED_LINKS')) {
            this.textChannel.send(`Now playing: **${song.title}**`)
        } else {
            var embed = new MessageEmbed().setTitle('**Now playing**').setColor(0x00ffff).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true).addField('Requested by', song.user?.toString(), true)
            this.textChannel.send(embed)
        }
        this.registerQueueCommands() // update skip choices

    }

    /**
     * 
     * @param {Number} nr - integer with position in this.mergedQueue
     */
    skipSong(nr) {
        // skip current song
        if (nr == 0) {
            this.dispatcher.end()
        }
        // skip songs in queue
        else {
            this.songs.splice(nr - 1, 1)
            this.registerQueueCommands() // update skip choices
        }
    }

    /**
     * Registers commands for queue
     */
    async registerQueueCommands() {
        let copy = JSON.parse(JSON.stringify(this.musicGuildCommand))
        let choices = copy.options[2].options[0].choices

        for (let i in this.mergedQueue) {
            if (parseInt(i) >= 25) break
            choices.push({
                name: `${i} - ${this.mergedQueue[i].title}`,
                value: parseInt(i)
            })
        }

        await this.guild.commands.create(copy)
    }

    /**
     * Joins voice channel and sets SongQueue#voiceConnection
     * @returns {Promise} error object if promise rejects
     */
    createVoiceConnection() {
        return new Promise(async (resolve, reject) => {
            this.voiceChannel.join().then(conn => {
                this.voiceConnection = conn
                resolve('ok')
            }).catch(reject)
        })
    }

    /**
     * Fetches song from youtube
     * @param {String} resolvable search query or direct link
     * @returns {Song} with song data (without member property)
     */
    fetchSongData(resolvable) {
        return new Promise(async (resolve, reject) => {
            const songInfo = await ytdl.getBasicInfo(resolvable).catch(err => {
                // console.log('Url fetch failed')
            })

            var song

            if (!songInfo) {
                const filters = await ytsr.getFilters(resolvable)
                var filter = filters.get('Type').get('Video')
                const search = await ytsr(filter.url, { limit: 1 }).catch(err => { })
                if (!search || search.items.length < 1) {
                    console.log('YT search failed')
                    return resolve(null)
                }

                const item = search.items[0]
                // console.log(item)

                song = {
                    title: item.title,
                    url: item.url,
                    length: item.duration,
                    thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                }
            } else {
                // console.log(songInfo)
                song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                    length: formatTime(songInfo.videoDetails.lengthSeconds),
                    thumbnail: `https://i.ytimg.com/vi/${songInfo.videoDetails.videoId}/hqdefault.jpg`,
                }
            }
            // console.log(song)
            resolve(song)
        })
    }

    /**
     * Creates embed object from song queue
     * @param {boolean} canDoEmbed if false, return primitive JSON.stringify() version
     * @param {boolean} shortEmbed  if true, checks length and returns only those songs that fit
     * @returns {MessageEmbed} embed with playlist data
     */
    getQueueEmbed(canDoEmbed = true, shortEmbed = false) {
        if (!this.songs.length && !this.currentSong) {
            return 'Queue is empty'
        }
        if (!canDoEmbed) {
            return '```' + JSON.stringify(this.mergedQueue, null, 4) + '```'
        } else {
            var reduceFunc = (acc, song, i) => acc + `${i} - [${song.title}](${song.url}) [${formatTime(song.length)}] - requested by ${song.user}\n`

            // shorter embed that will fit in messages
            if (shortEmbed) {
                var embed = new MessageEmbed().setTitle('**Song queue**').setColor(0x0000ff)

                var length = 1024
                var i = 0
                var firstFew = ''
                for (let song of this.mergedQueue) {
                    let s = reduceFunc('', song, i)
                    length -= s.length
                    i++
                    if (length <= 0) break
                    firstFew += s
                }

                embed.addField(`Queue too long`, `Queue is too long to send in one message - logging first ${i} songs instead`).addField('Queue', firstFew).addField('Total queue length', this.totalPlayTime).addField(`Total songs in queue`, `${this.songs.length}`)
                return embed
            }
            else {
                var embed = new MessageEmbed().setTitle('**Song queue**').setColor(0x0000ff)
                var str = this.mergedQueue.reduce(reduceFunc, '')
                embed.addField('Queue', str)
                embed.addField('Total queue length', this.totalPlayTime)
                return embed
            }
        }
    }

    /**
     * Creates embed object from song object
     * @param {Song} song 
     * @returns {MessageEmbed} embed with song data
     */
    createSongEmbed(song) {
        var embed = new MessageEmbed()
            .setTitle('**Song added to queue**')
            .setColor(0x00ff00)
            //.setImage(song.thumbnail)
            .addField('Title', song.title, true)
            .addField('Url', song.url, true)
            .addField('Length', song.length, true)
            .addField('Total queue length', this.totalPlayTime, true)
        return embed
    }

    /**
     * Creates embed object from playlist object
     * @param {Object} playlist 
     * @returns {MessageEmbed} embed with playlist data
     */
    createPlaylistEmbed(playlist) {
        var song1 = playlist.items[0]
        var embed = new MessageEmbed()
            .setTitle('**Playlist added to queue**')
            .setColor(0x00ff00)
            // .setImage(`https://i.ytimg.com/vi/${song1.id}/hqdefault.jpg`)
            .addField('Title', playlist.title, true)
            .addField('Url', playlist.url, true)
            .addField('Total queue length', this.totalPlayTime, true)
        return embed
    }

}

module.exports = SongQueue