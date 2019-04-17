const Discord = require('discord.js');
const client = new Discord.Client();
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
var logger = require('tracer').colorConsole();

// #region importing settings files
var config
var token
var display
// token V
try {
    token = require("./data/token.json").token
}
catch (err) {
    let tokenPlaceholder = {
        token: "bot_token_here"
    }
    fs.writeFileSync("./data/token.json", JSON.stringify(tokenPlaceholder, null, 2))
    throw new Error("you need to specify bot token in ./data/token.json")
}
// token ^
try {
    config = require("./data/config.json")
}
catch (err) {
    fs.writeFile("./data/config.json", JSON.stringify({}, null, 2), (err) => {
        config = require("./data/config.json")
    })
}
// display V
try {
    display = require("./data/display.json")
}
catch (err) {
    let displayPlaceholder = {
        "message": "Debug version is currently running. Bot might not function properly (or at all)",
        "type": "PLAYING"
    }
    fs.writeFile("./data/display.json", JSON.stringify(displayPlaceholder, null, 2), (err) => {
        display = require("./data/display.json")
    })
}
// display ^
// #endregion

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

    // #region absolute commands
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
            autoVoice: false,
            autoVoiceFirstChannel: 0,
            jp2Channel: false,
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
    if (msg.content.startsWith("!echo ") && checkPerms(msg.author.id, "ignis")) {
        let cnt = msg.content.split(' ')
        cnt.shift()
        cnt = cnt.join(' ')
        msg.channel.send(cnt)
        return
    }
    // #endregion absolute commands

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
    if (oldMember.voiceChannelID && newMember.voiceChannelID) {
        if (oldMember.voiceChannelID != newMember.voiceChannelID) {
            //console.log("change");

            if (!config[newMember.guild.id].autoVoice) return
            checkVoiceChannels(newMember.voiceChannel.guild)
        }
    }
    else if (newMember.voiceChannelID) {
        //console.log("join");
        githubNotify(newMember)

        if (!config[newMember.guild.id].autoVoice) return
        checkVoiceChannels(newMember.voiceChannel.guild)
    }
    else if (oldMember.voiceChannelID) {
        //console.log("leave");

        if (!config[newMember.guild.id].autoVoice) return
        checkVoiceChannels(oldMember.voiceChannel.guild)
    }
})

// #region helpers

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

// #endregion

// #region commands
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
            cmd: "autovoicefirst <int>",
            desc: "changes iteration start point for autovoice channels",
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

new ResText(commands, "autovoicefirst", msg => {
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }

    let nr = parseInt(msg.content.split(" ")[1])
    if (!isNaN(nr)) {
        config[msg.guild.id].autoVoiceFirstChannel = nr
        saveConfig(msg.channel, `First autovoice channel set to ${nr}`)
        var voiceChannels = msg.guild.channels.filter(channel => channel.type == "voice" && channel.parentID == config[msg.guild.id].autoVoice).array()
        voiceChannels.forEach((channel, iterator) => { channel.setName((iterator + config[msg.guild.id].autoVoiceFirstChannel).toString()) })
    }
    else {
        msg.reply("Given value is NaN")
    }
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

new ResText(commands, "jp2channel", msg => {
    if (!checkPerms(msg.author.id, "admin", msg.guild.id)) {
        msg.reply("You dont have permission to use this command!")
        return;
    }

    let channel = msg.content.split(" ")[1]
    if (channel) {
        if (msg.guild.channels.get(channel)) {
            if (msg.guild.channels.get(channel).type == 'text') {
                config[msg.guild.id].jp2Channel = channel
                console.log("jp2 enabled");
                msg.channel.send("jp2channel enabled")
            }
            else {
                console.log("wrong channel");
                msg.channel.send("id doesn't belong to text channel")
            }
        }
        else {
            console.log("wrong id");
            msg.channel.send("wrong id")
        }
    }
    else {
        config[msg.guild.id].jp2Channel = false
        //console.log("jp2Channel disabled");
        msg.channel.send("jp2Channel disabled")
    }
    saveConfig()

})
// #endregion

// #region voice functions
function checkVoiceChannels(guild) {
    var voiceChannels = guild.channels.filter(channel => channel.type == "voice" && channel.parentID == config[guild.id].autoVoice).array()
    // var tab = []
    //var emptycount = 0

    var emptycount = voiceChannels.filter(channel => channel.members.firstKey() == undefined).length
    // console.log(emptycount);
    if (emptycount == 0) {
        // console.log("there are no empty channels");
        guild.createChannel((voiceChannels.length + config[guild.id].autoVoiceFirstChannel).toString(), 'voice', null, "autovoice activity")
            .then(channel => {
                channel.setParent(config[guild.id].autoVoice)
                // console.log("channel added");
            })
            .catch(err => {
                // console.log("channel create fail".red);
                var channels = guild.channels.filter(a => a.type == "text").array()
                channels[0].send("unable to create voice channel - permissions might be insufficient").then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
            });
    }
    else if (emptycount > 1) {
        // console.log("there are to many empty channels")
        var left = false // skips first mathing empty channel
        let iterator = 0
        voiceChannels.forEach(channel => {
            // console.log(channel.name);
            if (channel.members.firstKey()) {
                // console.log("filled")
                channel.setName((iterator + config[guild.id].autoVoiceFirstChannel).toString())
                iterator++
            }
            else {
                // console.log("empty")
                if (left) { // if one empty is left can delete channels
                    channel.delete("autovoice activity")
                        .then(channel => {
                        })
                        .catch(err => {
                            console.log("channel delete fail");
                            var channels = guild.channels.filter(a => a.type == "text").array()
                            channels[0].send("unable to delete voice channel - permissions might be insufficient").then(msg => msg.delete(config[msg.guild.id].tempMsgTime))
                        });
                }
                else { // else saves this one
                    left = true
                    channel.setName((iterator + config[guild.id].autoVoiceFirstChannel).toString())
                    iterator++
                }
            }
        })
    }
}
// #endregion

// #region interval
var interval = setInterval(() => {
    let date = new Date()
    //    console.log(date.getHours(), date.getMinutes());
    if (date.getHours() == 21 && date.getMinutes() == 37) {
        for (let guildId of Object.keys(config)) {
            if (config[guildId].jp2Channel) {
                var guild = client.guilds.get(guildId);
                if (guild && guild.channels.get(config[guildId].jp2Channel)) {
                    guild.channels.get(config[guildId].jp2Channel).send("2137", { file: "https://www.wykop.pl/cdn/c3201142/comment_udrlGttBEvyq9DsF86EsoE2IGbDIx4qq.jpg" });
                }
            }
        }
    }
}, 1000 * 60)
// #endregion

// #region github notifier
function githubNotify(member) {
    if (member.id == '226032144856776704') {// ignis
        try {
            let github = JSON.parse(fs.readFileSync('./data/github_pulls.json'))

            console.log(github);
            let waitingReviews = false
            //          //webhook-test, cinnamon-game
            let repos = ['181872271', '179300870']
            repos.forEach(repo => {
                if (github[repo]) {
                    console.log(github[repo]);
                    let tabs = Object.values(github[repo])
                    if (tabs.find(tab => tab.includes('ignis05'))) {
                        waitingReviews = true
                    }
                }
            })
            console.log('waiting for reviews from ignis: ', waitingReviews);
            if (waitingReviews) {
                member.send('pull requesty czekają')
            }
        }
        catch (err) { }
    }

    if (member.id == '302475226036305931') {// waifu_InMyLaifu
        try {
            let github = JSON.parse(fs.readFileSync('./data/github_pulls.json'))

            console.log(github);
            let waitingReviews = false
            //          //cinnamon-game
            let repos = ['179300870']
            repos.forEach(repo => {
                if (github[repo]) {
                    console.log(github[repo]);
                    let tabs = Object.values(github[repo])
                    if (tabs.find(tab => tab.includes('koroshiG'))) {
                        waitingReviews = true
                    }
                }
            })
            console.log('waiting for reviews from waifu_InMyLaifu: ', waitingReviews);
            if (waitingReviews) {
                member.send('pull requesty czekają')
            }
        }
        catch (err) { }
    }
}
// #endregion github notifier

client.on('error', console.error);

client.login(token);
