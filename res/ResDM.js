class ResDM {
    constructor(client, msg) {
        if(!client || !msg){
            throw new Error("not enough parameters")
        }
        console.log("recieved command " + msg.content + " from " + msg.author.tag + " on priv");

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
            help(msg, ["help", "dev"])
        }
    }
}
module.exports = ResDM;