const { CommandInteraction, MessageEmbed, Collection, Guild } = require('discord.js')
const SongQueue = require('../res/SongQueue')
const { formatTime, config, saveConfig } = require('../res/Helpers')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const ytpl = require('ytpl')

const songQueuesCol = new Collection()

/**
 * Called to cleanup when SongQueue is destroyed
 * @param {Guild} guild 
 */
async function destroyQueueHandler(guild) {
    console.log('unregistering commands')
    songQueuesCol.delete(guild.id)
    let commands = await guild.commands.fetch()
    let musicCMD = commands.find(c => c.name == 'music')
    musicCMD.delete()
}


/**
 * 
 * @param {Guild} guild 
 */
async function registerQueueCommands(guild) {
    console.log(`Registering extra commands`)
    await guild.commands.create(musicGuildCommand)

}

// commands registered on guild when the queue is initialised
const musicGuildCommand = {
    name: 'music',
    description: 'Manages youtube playback functions - guild version',
    options: [
        {
            name: 'stop',
            type: 'SUB_COMMAND',
            description: 'Leaves the voice channel and deletes the queue.',
        },
    ]
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
        ]
    },
    /**
     * @param inter {CommandInteraction}
     **/
    run: async inter => {
        if (!inter.guild) return inter.reply(`This command is exclusive to guilds.\n`, { ephemeral: true })

        inter.defer()

        // if queue not initialised, create it
        /**
        * @type {SongQueue} voiceConnection
        */
        var queue = songQueuesCol.get(inter.guild)
        if (!queue) {
            // voice channel check
            if (!inter.member.voice?.channel) return inter.editReply(`You need to be in a voice channel to create song queue.`)

            // use designated guildMusicChannel if set in config
            let guildMusicChannel = false
            if (config[inter.guildID].guildMusicChannel) {
                try {
                    guildMusicChannel = await inter.client.channels.fetch(config[inter.guildID].guildMusicChannel)
                } catch (err) {
                    console.log(`failed to fetch guildMusicChannel (${config[inter.guildID].guildMusicChannel}) - removing from config`)
                    config[inter.guildID].guildMusicChannel = false
                    saveConfig()
                    guildMusicChannel = false
                }
            }

            // create new SongQueue
            queue = new SongQueue(guildMusicChannel || inter.member.voice.channel, inter.channel)
            try {
                await queue.createVoiceConnection()
            } catch (err) {
                return inter.editReply(`Connecting to voice channel failed:\n${err}`)
            }
            queue.onDestroy = destroyQueueHandler
            songQueuesCol.set(inter.guildID, queue) // push to collection of queues
            registerQueueCommands(inter.guild)
        }

        var command = inter.options[0]
        switch (command.name) {
            case 'play':
                try {
                    var song = await queue.addToQueue(command.options[0].value)
                } catch (err) {
                    return inter.editReply(`Failed to download song data`)
                }
                //todo: embed reply
                inter.editReply(`Added ${song.title} to the queue.`)
                if (!queue.isPlaying) queue.playNext()
                break
            case 'stop':
                queue.destroy()
                inter.editReply(`Finished playing`)

        }
    },
}
