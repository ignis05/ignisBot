const { StreamDispatcher, VoiceChannel, VoiceConnection, TextChannel, MessageEmbed } = require('discord.js')

const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const ytpl = require('ytpl')

class SongQueue {
    /**
     * Initializes queue and binds it to voice channel and guild
     * @param {VoiceChannel} voiceChannel 
     * @param {TextChannel} textChannel 
     */
    constructor(voiceChannel, textChannel) {
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
     * @returns {Promise} after its done
     */
    addToQueue(query) {
        return new Promise(async (resolve, reject) => {
            var song = await this.fetchSongData(query)
            if (!song) return reject('failed to fetch song')
            this.songs.push(song)
            resolve(song)
        })
    }

    destroy() {
        console.log('destroying queue')
        if (this.dispatcher) this.dispatcher.off('finish')
        if (this.isPlaying) this.dispatcher.end()
        if (this.voiceConnection) this.voiceChannel.leave()
        this.onDestroy?.(this.guild)
    }

    async playNext() {
        this.isPlaying = true

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
            var embed = new MessageEmbed().setTitle('**Now playing**').setColor(0x00ffff).setImage(song.thumbnail).addField('Title', song.title, true).addField('Url', song.url, true).addField('Length', song.length, true).addField('Requested by', 'todo:fix this'/* song.user.toString() */, true)
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
     * @returns {Object} with song data
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
            console.log(song)
            resolve(song)
        })
    }

}

module.exports = SongQueue