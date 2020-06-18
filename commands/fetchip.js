module.exports = {
	name: 'fetchip',
	aliases: ['findip','lastip'],
	categories: ['text', 'dm'],
	desc: `Finds last message including IP address`,
	help: "`fetchip` - bot will search last 100 messages and return first IP address found",
	run: async msg => {
        const urlRegex = /(\S+\.\S+|\d+\.\d+\.\d+\.\d+)(:\d+)?/
        var messages = await msg.channel.messages.fetch({ limit: 100 },false).catch(console.error)
        var validIP = null
        for (let content of messages.map(ms => ms.cleanContent)){
            let res = urlRegex.exec(content)
            if (!res) continue
            let ip = res[0]
            if(ip.split(':')[0].split('.').every(nr => parseInt(nr) <= 255)){
                validIP = ip
                break
            }
        }
        msg.channel.send(validIP || `No valid ip addresses were found in last 100 messages`)
	},
}
