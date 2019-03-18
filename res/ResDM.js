class ResDM {
    constructor(client, msg, commands) {
        if(!client || !msg){
            throw new Error("not enough parameters")
        }
        console.log("recieved command ".blue + msg.content.reverse + " from ".blue + msg.author.tag.reverse);

        if (msg.content.toLowerCase() == "!ping") {
            console.log("Pong!".rainbow);
            msg.reply("Pong!")
        }

        if (msg.content == "!invite") {
            console.log("sending invite link".rainbow);
            client.generateInvite(['ADMINISTRATOR'])
                .then(link => msg.channel.send(`Generated bot invite link: ${link}`))
                .catch(console.error);
        }

        if (msg.content == "!help") {
            console.log("sent help");
            commands.help(msg)
        }
    }
}
module.exports = ResDM;