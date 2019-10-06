module.exports = {
	name: 'remind',
	aliases: ['remindme'],
	categories: ['text', 'dm'],
	desc: `sends user a dalayed message with reminder`,
	help: '`remind <time> <msg>` - bot will reposnd with <msg> after <time> has passed\n-time can be passed as minutes (ex: 30) or hours (ex: 0.5h)',
	run: msg => {
		let msgArr = msg.content.split(' ')
		let time = msgArr[1].replace(',', '.')
		let pureTime = time.endsWith('h') ? parseFloat(time.slice(0, -1)) * 60 : parseFloat(time)
		if (isNaN(pureTime)) {
			console.log('NaN')
			return
		}
		console.log(`Set reminder on ${new Date(Date.now() + pureTime * 60000).toLocaleString()}`)
		msg.reply(`Set reminder on ${new Date(Date.now() + pureTime * 60000).toLocaleString()}`)
		msg.client.setTimeout(() => {
			msg.author.send(`${msg.author} ${msgArr.slice(2).join(' ')}`)
		}, pureTime * 60000)
	},
}