module.exports = {
	name: 'execute',
	run: msg => {
		var content = msg.content.split(' ').slice(1).join(' ')
		if (!content) return msg.channel.send('No command provided')
		let temp = content.split('```')
		if (temp.length < 3) return msg.channel.send('Wrap your code as multi line code with: ```')
		var command = temp[1].replace('\n', ';')
		if (command.startsWith('js')) command = command.slice(2)
		console.log('executing:\n', command)
		const func = Function('msg', command)
		try {
			func(msg)
		} catch (err) {
			msg.channel.send(`error:\n${err}`)
		}
	},
}
