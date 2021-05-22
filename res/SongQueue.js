const { StreamDispatcher, VoiceChannel, VoiceConnection, TextChannel, MessageEmbed, GuildMember } = require('discord.js')
const { formatTime } = require('./Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const ytpl = require('ytpl')

const PLAYLIST_LIMIT = 50

/**
 * @typedef {Object} Song
 * @property {String} title
 * @property {String} url
 * @property {Number} length
 * @property {String} thumbnail
 * @property {GuildMember} user
 */

class SongQueue {
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
            var playlist = await ytpl(playlisturl, { limit: serverQueue ? PLAYLIST_LIMIT - serverQueue.songs.length : PLAYLIST_LIMIT }).catch(err => console.log('Failed to resolve queue'))
            if (playlist?.items?.length < 2) return reject('Failed to resolve queue')

            for (let s0 of playlist.items) {
                /**
                 * @type {Song}
                 */
                var song = {
                    title: s0.title,
                    url: s0.shortUrl,
                    length: parseFloat(s0.durationSec),
                    thumbnail: `https://i.ytimg.com/vi/${s0.id}/hqdefault.jpg`,
                    user: member,
                }
                this.songs.push(song)
            }
            resolve(playlist)
        })
    }

    /** 
     * Gets summed lenghts of all songs in queue
     * @returns {Number} total length of all songs in the queue
     */
    get totalPlayTime() {
        return this.songs.reduce((acc, song) => (acc += song.length), 0)
    }

    /**
     * Destroys queue. 
     * Launches this.onDestroy(this.guild) if that function is registered.
     */
    destroy() {
        console.log('destroying queue')
        if (this.dispatcher) this.dispatcher.off('finish')
        if (this.isPlaying) this.dispatcher.end()
        if (this.voiceConnection) this.voiceChannel.leave()
        this.onDestroy?.(this.guild)
    }

    /**
     * Removes fist song from the queue and plays it through StreamDispatcher. 
     * If queue is empty calling this will kill voiceConnection and launch onDestroy
     */
    async playNext() {
        this.isPlaying = true

        /**
        * @type {Song}
        */
        var song = this.songs.shift()
        if (!song) {
            this.textChannel.send('Queue finished. Disconnecting.')
            this.voiceChannel.leave()
            this.onDestroy?.(this.guild)
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
                console.log('Url fetch failed')
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
            // console.log(song)
            resolve(song)
        })
    }


    /**
     * Creates embed object from song object
     * @param {Song} song 
     * @returns {MessageEmbed} embed with song data
     */
    static createSongEmbed(song) {
        var embed = new MessageEmbed()
            .setTitle('**Song added to queue**')
            .setColor(0x00ff00).setImage(song.thumbnail)
            .addField('Title', song.title, true)
            .addField('Url', song.url, true)
            .addField('Length', formatTime(song.length), true)
            .addField('Total queue length', formatTime(this.totalPlayTime), true)
        return embed
    }

    /**
     * Creates embed object from playlist object
     * @param {Object} playlist 
     * @returns {MessageEmbed} embed with playlist data
     */
    static createPlaylistEmbed(playlist) {
        var song1 = playlist.items[0]
        var embed = new MessageEmbed()
            .setTitle('**Playlist added to queue**')
            .setColor(0x00ff00)
            .setImage(`https://i.ytimg.com/vi/${song1.id}/hqdefault.jpg`)
            .addField('Title', playlist.title, true)
            .addField('Url', playlist.url, true)
            .addField('Total queue length', formatTime(this.totalPlayTime), true)
        return embed
    }

}

module.exports = SongQueue