module.exports = {
	name: 'remind',
	aliases: ['remindme'],
	categories: ['text', 'dm'],
	desc: `sends user a dalayed message with reminder`,
	help: '`remind <time> <msg>` - bot will reposnd with <msg> after <time> has passed\n-time can be passed as minutes (ex: 30) or hours (ex: 0.5h) or as [epoh timestamp](https://www.epochconverter.com/)',
	run: msg => {
		let msgArr = msg.content.split(' ').filter(arg => arg != '')
		let time = msgArr[1].replace(',', '.')
		let pureTime = time.endsWith('h') ? parseFloat(time.slice(0, -1)) * 60 : parseFloat(time)
		if (isNaN(pureTime)) {
			console.log('NaN')
			msg.reply(`Invalid argument - NaN`)
			return
		}
		var timeout = pureTime * 60000
		// 25.04.2020 - epoch timestamp
		if (pureTime > 1587823909) {
			timeout = pureTime * 1000 - Date.now()
		}
		console.log(`Set reminder on ${new Date(Date.now() + timeout).toLocaleString()}`)
		msg.reply(`Set reminder on ${new Date(Date.now() + timeout).toLocaleString()}`)
		msg.client.setTimeout(() => {
			msg.channel.send(`${msg.author} ${msgArr.slice(2).join(' ')}`).catch(err => console.log(err.message))
		}, timeout)
	},
}
