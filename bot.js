const Discord = require('discord.js');
const client = new Discord.Client();
var token = require("./data/token.json").token
var fs = require('fs');
const ytdl = require('ytdl-core');
var colors = require("colors");
colors.setTheme({
    reverse: ['black', 'bgWhite'],
    success: ["green"],
    warn: ["yellow"],
    error: ["red", "underline"],
    greenRev: ["black", "bgGreen"],
    redRev: ["black", "bgRed"]
});
var config = require("./data/config.json")
var display = require("./data/display.json")
var logger = require('tracer').colorConsole();


// #region importing classes
const ResDM = require("./res/ResDM.js")
const ResText = require("./res/ResText.js")
// #endregion importing classes

client.on('ready', () => {
    client.user.setActivity(display.message, { type: display.type })
    console.log("I'm alive!".rainbow);
    console.log("Logged in as " + client.user.tag.green);
    client.fetchUser("226032144856776704").then(ignis => {
        ignis.send("I'm alive!")
    })
});

client.on('guildCreate', (guild) => {
    if (guild.available) {
        console.log(`Joined guild ${guild.name} (${guild.id})`.rainbow)
        var channels = guild.channels.filter(a => a.type == "text").array()
        channels[0].send("!")
    }
})

client.on('message', msg => {
    if (msg.author.bot) return //ignore bots and self
    if (!msg.guild && msg.channel.id != "551445397411856398") return //ignore priv msg

    if (msg.channel.id == "551445397411856398") { //dont ignore priv msg's from me
        new ResDM(client, msg, commands)
        return
    }

    //#region absolute commands
    if (msg.content == "!guild enable" && checkPerms(msg.author.id, "ignis")) {
        console.log("enabling bot for guild: ".green + msg.guild.id.greenRev);
        config[msg.guild.id] = {
            prefix: "!",
            tempMsgTime: "5000",
            bannedChannels: [],
            perms: {
                admin: [],
                purge: [],
                voice: []
            },
            autoVoice: false
        }
        saveConfig(msg.channel, "guild enabled")
        return
    }
    if (msg.content == "!guild disable" && checkPerms(msg.author.id, "ignis")) {
        console.log("disabling bot for guild: ".red + msg.guild.id.redRev);
        delete config[msg.guild.id]
        saveConfig(msg.channel, "guild disabled")
        return
    }
    if (msg.content == "!invite" && checkPerms(msg.author.id, "ignis")) {
        console.log("sending invite link".rainbow);
        client.generateInvite(['ADMINISTRATOR'])
            .then(link => msg.channel.send(`Generated bot invite link: ${link}`))
            .catch(console.error);
        return
    }
    if (msg.content == "!checkperms" && checkPerms(msg.author.id, "ignis")) {
        var perms = msg.guild.me.permissions.toArray()
        console.log(perms);
        var desc = ""
        for (let i in perms) {
            desc += `\n- ${perms[i]}`
        }
        const embed = new Discord.RichEmbed()
            .setTitle('My permissions on this guild are:')
            .setColor(0xFF0000)
            .setDescription(desc);
        msg.channel.send(embed);
        return
    }
    //#endregion

    if (!config[msg.guild.id]) { //check guilds
        logger.warn("attempt to use bot on disabled guild")
        msg.reply("Bot activity is disabled on this guild, use `guild enable`")
        return
    }

    if (config[msg.guild.id].bannedChannels.includes(msg.channel.id) && !checkPerms(msg.author.id, "admin", msg.guild.id)) return //checks channels

    if (msg.content.charAt(0) == config[msg.guild.id].prefix) {
        var command = msg.content.split("")
        command.shift()
        command = command.join("")
        console.log("recieved command ".blue + command.reverse + " from ".blue + msg.author.tag.reverse);
        command = command.split(" ")[0].toLowerCase()

        if (commands[command]) {
            commands[command](msg)
        }
        else {
            console.log("Command unknown".yellow);
            msg.channel.send("Command unknown.\nType \`help\` for help")
        }
    }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    if (!config[newMember.guild.id].autoVoice) return

    if (oldMember.voiceChannelID && newMember.voiceChannelID) {
        if (oldMember.voiceChannelID != newMember.voiceChannelID) {
            //console.log("change");
            checkVoiceChannels(newMember.voiceChannel.guild)
        }
    }
    else if (newMember.voiceChannelID) {
        //console.log("join");
        checkVoiceChannels(newMember.voiceChannel.guild)
    }
    else if (oldMember.voiceChannelID) {
        //console.log("leave");
        checkVoiceChannels(oldMember.voiceChannel.guild)
    }
})

//#region helpers

function checkPerms(uid, perm, guildID) { //return true if user has permisssion
    if (perm == "ignis") {
        return (uid == 226032144856776704)
    }


    let user = (config[guildID].perms[perm].find(o => o.id == uid)) //if specified perms

    if (config[guildID].perms.admin.find(o => o.id == uid)) user = true //overwrite for admins
    if (uid == 226032144856776704) user = true //overwrite for ignis

    if (user) {
        console.log("permission granted".green);
        return true
    }
    else {
        console.log("permission denied".red);
        return false
    }
}
function getUserFromId(uID, msg) {
    return msg.guild.members.get(uID).user
}
function saveConfig(channel, reply) { //   saveConfig(msg.channel, "success!")
    fs.writeFile("./data/config.json", JSON.stringify(config, null, 2), (err) => {
        if (err) console.log(err)
        console.log("modified config.json".green);
        if (reply) {
            channel.send(reply)
        }
    })
}
function makeID(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

//#endregion

//#region commands
var commands = {};
new ResText(commands, "ping", msg => {
    console.log("Pong!".rainbow);
    msg.reply("Pong!")
})

new ResText(commands, "help", msg => {
    var helpDB = [
        {
            cmd: "help",
            desc: "displays this message",
        },
        {
            cmd: "ping",
            desc: "replies with pong",
        },
        {
            cmd: "perms <list / add / del> <mention> <permission>",
            desc: "<list> displays permissions, <add / del> changes permission for mentioned user",
        },
        {
            cmd: "purge [x]",
            desc: "deletes x messages from channel (5 by default)",
        },
        {
            cmd: "blacklist",
            desc: "adds / removes current channel from blacklist",
        },
        {
            cmd: "voice <name / url>",
            desc: "plays sound from predefined source or youtube url",
        },
        {
            cmd: "autovoice [category id]",
            desc: "enables auto managment of voice channels in given category (if no id given disables it)",
        },
        {
            cmd: "setprefix <char>",
            desc: "changes prefix for this guild",
        },
    ]
    var specialHelpDB = [
        {
            cmd: "reload",
            desc: "reloads config.json file",
        },
        {
            cmd: "guild <enable / disable>",
            desc: "enables / disables bot activity on current guild",
        },
        {
            cmd: "invite",
            desc: "generates invite",
        },
        {
            cmd: "checkperms",
            desc: "displays bot's permissions on current guild",
        },
    ]

    var desc = `"<required variable>", [optional variable]\n`
    for (let cmd of helpDB) {
        desc += `\n **${cmd.cmd}**\n     - ${cmd.desc}\n`
    }
    if (msg.content.split(" ")[1] == "debug" || msg.content.split(" ")[1] == "dev") {
        desc += "\n\n__**debug commands:**__"
        for (let cmd of specialHelpDB) {
            desc += `\n **${cmd.cmd}**\n     - ${cmd.desc}\n`
        }
    }

    const embed = new Discord.RichEmbed()
        .setTitle('Commands list:')
        .setColor(0xFF0000)
        .setDescription(desc);
    msg.channel.send(embed);
})

new ResText(commands, "perms", msg => {
    var command = msg.content.split(" ")
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    switch (command[1]) {
        case "list":
            var list = ""
            for (var i in config[msg.guild.id].perms) {
                list += `\n__${i}:__`
                for (var j in config[msg.guild.id].perms[i]) {
                    list += `\n - ${config[msg.guild.id].perms[i][j].name}`
                }
            }
            var embed = new Discord.RichEmbed()
                .setTitle('Permissions list:')
                .setColor(0xFF0000)
                .setDescription(list)
            msg.channel.send(embed)
            break;
        case "add":
            var uID = msg.mentions.users.firstKey()
            console.log(uID);
            var perms = command.slice(3)
            if (!perms) break;
            console.log(`user: ${uID}, perms: `, perms);

            for (var i in perms) {
                if (perms[i] == "admin") { //if someone tires to give admin perm -- extra check if me
                    if (!checkPerms(msg.author.id, "ignis", msg.guild.id)) {
                        continue;
                    }
                }
                if (!Object.keys(config[msg.guild.id].perms).includes(perms[i])) {
                    console.log("invalid perm".yellow);
                    msg.reply(`${perms[i]} is invalid perm!`)
                    continue;
                };
                if (!checkPerms(uID, perms[i], msg.guild.id)) {
                    config[msg.guild.id].perms[perms[i]].push({ name: getUserFromId(uID, msg).username, id: uID })
                    saveConfig(msg.channel, "success!")
                }
            }
            break;
        case "del": case "remove": case "delete":
            console.log("here".rainbow);
            var uID = command[2].slice(2, -1)
            var perms = command.slice(3)
            if (!perms) break;
            console.log(`user: ${uID}, perms: `, perms);

            for (var i in perms) {
                if (perms[i] == "admin") { //if someone tires to give admin perm -- extra check if me
                    if (!checkPerms(msg.author.id, "ignis", msg.guild.id)) {
                        continue;
                    }
                }
                if (!Object.keys(config[msg.guild.id].perms).includes(perms[i])) {
                    console.log("invalid perm".yellow);
                    msg.reply(`${perms[i]} is invalid perm!`)
                    continue;
                };

                if (checkPerms(uID, perms[i], msg.guild.id)) {
                    for (let z in config[msg.guild.id].perms[perms[i]]) {
                        if (config[msg.guild.id].perms[perms[i]][z].id == uID) {
                            config[msg.guild.id].perms[perms[i]].splice(z, 1)
                            break;
                        }
                    }
                    console.log(config[msg.guild.id]);

                }
            }
            saveConfig(msg.channel, "success!")
            break;
    }
})

new ResText(commands, "purge", (msg, recursion) => {
    var command = msg.content.split(" ")
    if (recursion) command[1] = `${recursion}`
    if (!checkPerms(msg.author.id, "purge", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    var x
    if (command[1] == undefined) {
        x = 5
    }
    else {
        x = (parseInt(command[1]) < 100 ? parseInt(command[1]) : 100)
    }
    console.log(`attempting to purge ${x} messages`);
    msg.channel.bulkDelete(x + 1)
        .then(() => {
            console.log("success".green);
            msg.channel.send(`Deleted ${x} messages.`).then(msg => msg.delete(config[msg.guild.id].tempMsgTime));
        })
        .catch(err => {
            if (err.code == 50034) {
                if (!recursion) {
                    msg.channel.send(`Some messages might be older than 14 days.\nCalculating valid purge.\nThis might take a moment...`)
                    x++
                }
                if (x > 0) {
                    commands.purge(msg, x - 1)
                }
                else {
                    msg.channel.send(`Purge failed. No valid messages`)
                }
            }
            else {
                msg.channel.send(`Purge failed. Permissions might be insufficient`)
            }
        })
})

new ResText(commands, "reload", msg => {
    if (!checkPerms(msg.author.id, "ignis", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));
    msg.reply("Reloaded config file")
})

new ResText(commands, "blacklist", msg => {
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    if (config[msg.guild.id].bannedChannels.includes(msg.channel.id)) {
        var i = config[msg.guild.id].bannedChannels.indexOf(msg.channel.id)
        config[msg.guild.id].bannedChannels.splice(i, 1)
        saveConfig(msg.channel, "Channel removed from blacklist")
    }
    else {
        config[msg.guild.id].bannedChannels.push(msg.channel.id)
        saveConfig(msg.channel, "Channel added to blacklist")
    }
})

new ResText(commands, "voice", msg => {
    var command = msg.content.split(" ")
    if (!checkPerms(msg.author.id, "voice", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }/* 
    if (!permissions.has('CONNECT')) {
        return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
    }
    if (!permissions.has('SPEAK')) {
        return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
    } */
    if (msg.member.voiceChannel) {
        msg.member.voiceChannel.join()
            .then(connection => {
                msg.channel.send('Joined voice channel');
                console.log("joined channel");
                var url = ""
                switch (command[1]) {
                    case "jp2":
                        url = "https://www.youtube.com/watch?v=hLuw6cep3JI"
                        break;
                    case "earrape":
                        url = "https://www.youtube.com/watch?v=MOvDrom0rjc"
                        break;
                    case "bruh":
                        url = "https://www.youtube.com/watch?v=2ZIpFytCSVc"
                        break;
                    case "begone":
                        url = "https://www.youtube.com/watch?v=R-k3rF_-Hgo"
                        break;
                    case "fortnite":
                        url = "https://www.youtube.com/watch?v=KNSiliBUsrU"
                        break;
                    case "sad":
                        url = "https://www.youtube.com/watch?v=2z7qykjme9I"
                        break;
                    default:
                        url = command[1]
                }
                if (ytdl.validateURL(url)) {
                    const dispatcher = connection.playStream(ytdl(url), { volume: 100 })

                    dispatcher.on('error', e => {
                        console.log("error".rainbow);
                        console.log(e);
                    })
                    dispatcher.on('end', () => {
                        console.log("leaving channel");
                        msg.member.voiceChannel.leave()
                        //msg.channel.send("Leaving voice channel")
                    })
                }
                else {
                    console.log("invalid url");
                    msg.channel.send("Invalid url!")
                    //msg.channel.send("Leaving voice channel")
                    msg.member.voiceChannel.leave()
                }
            })
            .catch(console.error);
    }
    else {
        msg.reply('You need to join a voice channel first!');
    }
})

new ResText(commands, "autovoice", msg => {
    var command = msg.content.split(" ")
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    if (command[1]) {
        if (msg.guild.channels.get(command[1])) {
            if (msg.guild.channels.get(command[1]).type == 'category') {
                config[msg.guild.id].autoVoice = command[1]
                console.log("autovoice enabled");
                msg.channel.send("autovoice enabled - make sure that bot has 'manage channels' permission")
            }
            else {
                console.log("wrong channel");
                msg.channel.send("id doesn't belong to category")
            }
        }
        else {
            console.log("wrong id");
            msg.channel.send("wrong id")
        }
    }
    else {
        config[msg.guild.id].autoVoice = false
        //console.log("autovoice disabled");
        msg.channel.send("autovoice disabled")
    }
    saveConfig()
})

new ResText(commands, "setprefix", msg => {
    var command = msg.content.split(" ")
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }
    if (command[1].length == 1) {
        config[msg.guild.id].prefix = command[1]
        saveConfig(msg.channel, `Chnaged prefix to: \`${command[1]}\``)
    }
    else {
        msg.channel.send("Invalid character")
    }
})
//#endregion

// #region voice functions
function checkVoiceChannels(guild) {
    var voiceChannels = guild.channels.filter(channel => channel.type == "voice" && channel.parentID == config[guild.id].autoVoice).array()
    var tab = []
    var emptycount = 0
    for (let i in voiceChannels) {
        if (voiceChannels[i].members.firstKey()) {
            tab.push("filled")
        }
        else {
            tab.push("empty")
            emptycount++
        }
    }
    if (emptycount == 0) {
        //console.log("there are no empty channels");
        guild.createChannel((tab.length + 1).toString(), 'voice', null, "autovoice activity")
            .then(channel => {
                channel.setParent(config[guild.id].autoVoice)
                //console.log("channel added");
            })
            .catch(err => {
                console.log("channel create fail".red);
                var channels = guild.channels.filter(a => a.type == "text").array()
                channels[0].send("unable to create voice channel - permissions might be insufficient").then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
            });
    }
    else if (emptycount > 1) {
        //console.log("there are to many empty channels")
        var left = false
        for (let i in voiceChannels) {
            if (voiceChannels[i].members.firstKey()) {
                // console.log("filled")
            }
            else {
                // console.log("empty")
                if (left) {
                    voiceChannels[i].delete("autovoice activity")
                        .then(channel => {

                        })
                        .catch(err => {
                            console.log("channel delete fail".red);
                            var channels = guild.channels.filter(a => a.type == "text").array()
                            channels[0].send("unable to delete voice channel - permissions might be insufficient").then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
                        });
                }
                else {
                    left = true
                }
            }
        }
    }
}
// #endregion



client.login(token);
/* todo:
    -autorole

    -logs msg
    -logs voice
*/
