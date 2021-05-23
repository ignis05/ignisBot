const { CommandInteraction, MessageEmbed, Collection, Guild, GuildChannel } = require('discord.js')
const SongQueue = require('../res/SongQueue')
const { config, saveConfig } = require('../res/Helpers')


const songQueuesCol = new Collection()

/**
 * Called to cleanup when SongQueue is destroyed
 * @param {Guild} guild 
 */
async function destroyQueueHandler(guild) {
    console.log('unregistering commands')
    songQueuesCol.delete(guild.id)
}


module.exports = {
    commandData: {
        name: 'music',
        description: 'Manages youtube playback functions',
        options: [
            {
                name: 'play',
                type: 'SUB_COMMAND',
                description: 'Adds song to the queue. If the queue is empty, connects bot to voice channel and initialises it.',
                options: [
                    {
                        name: 'query',
                        type: 'STRING',
                        description: "Link or search query.",
                        required: true,
                    }
                ]
            },
            {
                name: 'add_playlist',
                type: 'SUB_COMMAND',
                description: 'Adds songs from youtube playlist to queue.',
                options: [
                    {
                        name: 'link',
                        type: 'STRING',
                        description: "Youtube playlist link.",
                        required: true,
                    }
                ]
            },
            {
                name: 'set_music_channel',
                type: 'SUB_COMMAND',
                description: 'Sets channel for music related commands.',
                options: [
                    {
                        name: 'channel',
                        type: 'CHANNEL',
                        description: "Text channel that will be used for music logs",
                        required: true,
                    }
                ]
            },
        ]
    },
    /**
     * @param inter {CommandInteraction}
     **/
    run: async inter => {
        if (!inter.guild) return inter.reply(`This command is exclusive to guilds.\n`, { ephemeral: true })

        const canDoEmbed = inter.channel.permissionsFor(inter.guild.me).has('EMBED_LINKS')

        inter.defer()

        var command = inter.options[0]

        // dont initialise queue if just changing settings
        if (command.name != 'set_music_channel') {
            // if queue not initialised, create it
            /**
            * @type {SongQueue} voiceConnection
            */
            var queue = songQueuesCol.get(inter.guildID)
            if (!queue) {
                // voice channel check
                if (!inter.member.voice?.channel) return inter.editReply(`You need to be in a voice channel to create song queue.`)

                // use designated guildMusicChannel if set in config
                let guildMusicChannel = false
                if (config[inter.guildID].guildMusicChannel) {
                    try {
                        guildMusicChannel = await inter.client.channels.fetch(config[inter.guildID].guildMusicChannel)
                        // perms wont allow sending messages
                        if (!guildMusicChannel.permissionsFor(inter.guild.me).has('SEND_MESSAGES')) {
                            guildMusicChannel = false
                            console.log(`invalid perms on guildMusicChannel (${config[inter.guildID].guildMusicChannel}) - removing from config`)
                            config[inter.guildID].guildMusicChannel = false
                            saveConfig()
                        }
                    } catch (err) {
                        console.log(`failed to fetch guildMusicChannel (${config[inter.guildID].guildMusicChannel}) - removing from config`)
                        config[inter.guildID].guildMusicChannel = false
                        saveConfig()
                        guildMusicChannel = false
                    }
                }

                // create new SongQueue
                queue = new SongQueue(inter.member.voice.channel, guildMusicChannel || inter.channel)
                try {
                    await queue.createVoiceConnection()
                } catch (err) {
                    return inter.editReply(`Connecting to voice channel failed:\n${err}`)
                }
                queue.onDestroy = destroyQueueHandler
                songQueuesCol.set(inter.guildID, queue) // push to collection of queues
            }
        }

        switch (command.name) {
            case 'play':
                // fetch or return error
                try {
                    var song = await queue.addToQueue(command.options[0].value, inter.member)
                } catch (err) {
                    return inter.editReply(`Failed to download song data`)
                }

                if (canDoEmbed) inter.editReply(queue.createSongEmbed(song))
                else inter.editReply(`Added ${song.title} to the queue.`)

                // if not playing - start it
                if (!queue.isPlaying) queue.playNext()
                break
            case 'add_playlist':
                // fetch or return error
                try {
                    var playlist = await queue.addPlaylistToQueue(command.options[0].value, inter.member)
                } catch (err) {
                    return inter.editReply(`Failed to download playlist data`)
                }

                if (canDoEmbed) inter.editReply(queue.createPlaylistEmbed(playlist))
                else inter.editReply(`Added ${playlist.title} to the queue.`)

                // if not playing - start it
                if (!queue.isPlaying) queue.playNext()
                break
            case 'stop':
                queue.destroy()
                inter.editReply(`Finished playing`)
                break
            case 'queue':
                var res = queue.getQueueEmbed(canDoEmbed)
                try {
                    await inter.editReply(res)
                }
                catch (err) {
                    if (err.code == 50035) {
                        console.log('queue too long - sending short version')
                        res = queue.getQueueEmbed(canDoEmbed, true)
                        inter.editReply(res).catch(err => {
                            inter.editReply(`Failed to fetch queue:\n${err}`)
                        })

                    }
                    else inter.editReply(`Failed to fetch queue:\n${err}`)
                }
                break
            case 'skip':
                var num = command.options[0].value
                queue.skipSong(num)

                // send embed
                if (!canDoEmbed) {
                    msg.channel.send('```Skipped song ' + num + '\n' + JSON.stringify(queue.songs, null, 4) + '```')
                } else {
                    var res = queue.getQueueEmbed(true)
                    res.setTitle(`**Skipped song ${num}**`)
                    try {
                        await inter.editReply(res)
                    }
                    catch (err) {
                        if (err.code == 50035) {
                            console.log('queue too long - sending short version')
                            res = queue.getQueueEmbed(true, true)
                            res.setTitle(`**Skipped song ${num}**`)
                            inter.editReply(res).catch(err => {
                                inter.editReply(`Failed to fetch queue:\n${err}`)
                            })
                        }
                        else inter.editReply(`Failed to fetch queue:\n${err}`)
                    }
                }
                break
            case 'set_music_channel':
                let channel
                try {
                    /**
                     * @type {GuildChannel}
                     */
                    channel = await inter.client.channels.fetch(command.options[0].value)
                } catch (err) {
                    return inter.editReply(`Failed to access channel. Make sure the bot has correct permissions.`)
                }
                if (channel.type != 'text') return inter.editReply(`Selected channel needs to be a text channel.`)
                if (!channel.permissionsFor(inter.guild.me).has('SEND_MESSAGES')) return inter.editReply(`I can't send messages is that channel`)
                // valid channel
                config[inter.guildID].guildMusicChannel = channel.id
                await saveConfig()
                inter.editReply(`Set ${channel} as music bot channel.`)
                break

        }
    },
}
