module.exports = {
	commandData: {
		name: 'lastip',
		description: 'If bot can find a valid ip address within last 100 messages, it will repost it',
	},
	run: async interaction => {
        const urlRegex = /(\S+\.\S+|\d+\.\d+\.\d+\.\d+)(:\d+)?/
        var messages = await interaction.channel.messages.fetch({ limit: 100 },false).catch(console.error)
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
        interaction.reply(validIP || `No valid ip addresses were found in last 100 messages`)
	},
}
