const { countLines } = require('../res/Helpers')

module.exports = {
	name: 'countlines',
	aliases: ['lines'],
	categories: ['text', 'dm'],
	desc: `displays how many lines of code this bot consists of`,
	help: "`countlines` - bot will count lines from all it's files and send summary",
	run: async msg => {
		const code = await countLines()
		msg.channel.send(`My code currently consists of **${code.lines}** lines divided between **${code.files}** files.`)
	},
}
