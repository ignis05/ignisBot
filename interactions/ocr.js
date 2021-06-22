const { CommandInteraction, ApplicationCommandData } = require('discord.js')
const ocrSpace = require('ocr-space-api-wrapper')


module.exports = {
    /**
     * @type {ApplicationCommandData}
     */
    commandData: {
        name: 'ocr',
        description: 'Recognize text from images',
        options: [
            {
                name: 'url',
                type: 'SUB_COMMAND',
                description: 'Recognize text from image url',
                options: [
                    {
                        name: 'image_url',
                        type: 'STRING',
                        description: 'Link to the image',
                        required: true,
                    },
                    {
                        name: 'language',
                        type: 'STRING',
                        description: 'Language mode',
                        required: false,
                        choices: [
                            {
                                name: 'Arabic',
                                value: 'ara',
                            },
                            {
                                name: 'Chinese',
                                value: 'chs',
                            },
                            {
                                name: 'English',
                                value: 'eng',
                            },
                            {
                                name: 'German',
                                value: 'ger',
                            },
                            {
                                name: 'Japanese',
                                value: 'jpn',
                            },
                            {
                                name: 'Polish',
                                value: 'pol',
                            },
                            {
                                name: 'Russian',
                                value: 'rus',
                            },
                        ],
                    },
                ]
            },
            {
                name: 'message',
                type: 'SUB_COMMAND_GROUP',
                description: 'Use attachment from another message',
                options: [
                    {
                        name: 'link',
                        type: 'SUB_COMMAND',
                        description: 'Use message link',
                        options: [
                            {
                                name: 'message_link',
                                type: 'STRING',
                                description: 'Link to the message',
                                required: true,
                            },
                            {
                                name: 'language',
                                type: 'STRING',
                                description: 'Language mode',
                                required: false,
                                choices: [
                                    {
                                        name: 'Arabic',
                                        value: 'ara',
                                    },
                                    {
                                        name: 'Chinese',
                                        value: 'chs',
                                    },
                                    {
                                        name: 'English',
                                        value: 'eng',
                                    },
                                    {
                                        name: 'German',
                                        value: 'ger',
                                    },
                                    {
                                        name: 'Japanese',
                                        value: 'jpn',
                                    },
                                    {
                                        name: 'Polish',
                                        value: 'pol',
                                    },
                                    {
                                        name: 'Russian',
                                        value: 'rus',
                                    },
                                ],
                            },
                        ]
                    },
                    {
                        name: 'id',
                        type: 'SUB_COMMAND',
                        description: 'Use message id',
                        options: [
                            {
                                name: 'message_id',
                                type: 'STRING',
                                description: 'Message id (can be copied with developer options enabled in discord)',
                                required: true,
                            },
                            {
                                name: 'language',
                                type: 'STRING',
                                description: 'Language mode',
                                required: false,
                                choices: [
                                    {
                                        name: 'Arabic',
                                        value: 'ara',
                                    },
                                    {
                                        name: 'Chinese',
                                        value: 'chs',
                                    },
                                    {
                                        name: 'English',
                                        value: 'eng',
                                    },
                                    {
                                        name: 'German',
                                        value: 'ger',
                                    },
                                    {
                                        name: 'Japanese',
                                        value: 'jpn',
                                    },
                                    {
                                        name: 'Polish',
                                        value: 'pol',
                                    },
                                    {
                                        name: 'Russian',
                                        value: 'rus',
                                    },
                                ],
                            },
                        ]
                    },
                ]
            },
        ],
    },
    /**
     * @param inter {CommandInteraction}
     **/
    run: async inter => {
        var command = inter.options[0]
        if (command.type == 'SUB_COMMAND_GROUP') command = command.options[0]

        // set language mode (default english)
        var lang = 'eng'
        for (let option of command.options) {
            if (option.name == 'language') lang = option.value
        }
        inter.defer();

        try {
            var res
            var msgID = false
            var channel
            switch (command.name) {
                // image url
                case 'url':
                    res = await ocrSpace(command.options[0].value, { language: lang, scale: true })
                    break

                // message id or link
                case 'link':
                    try {
                        msgID = /\d+$/.exec(command.options[0].value)[0]
                        var channelID = /(\d+)\/\d+$/.exec(command.options[0].value)[1]
                    } catch (err) {
                        return inter.editReply(`Invalid message link.`)
                    }
                    channel = await inter.client.channels.fetch(channelID)
                case 'id':
                    if (!msgID) {
                        msgID = command.options[0].value
                        channel = inter.channel
                    }
                    var msg = await channel.messages.fetch(msgID)
                    if (msg.attachments.size < 1) return inter.editReply(`Message has no attachments`)
                    res = await ocrSpace(msg.attachments.first().url, { language: lang })

            }
            var resmsg = res?.ParsedResults[0]?.ParsedText
            if (resmsg) inter.editReply(`Result:\n\`\`\`${resmsg}\`\`\``)
            else {
                console.log(res)
                inter.editReply(`OCR failed`)
            }
        }
        catch (error) {
            console.log('ocr failed:')
            console.log(error)
            inter.editReply(`OCR failed:\n${error}`)
        }

    },
}
