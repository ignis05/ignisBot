const path = require('path')
const fs = require('fs')

module.exports = {
	name: 'countlines',
	aliases: ['lines'],
	categories: ['text', 'dm'],
	desc: `displays how many lines of code this bot consists of`,
	help: "`countlines` - bot will count lines from all it's files and send summary",
	run: async msg => {
		function countLines(filepath) {
			return new Promise((res, rej) => {
				var i
				var count = 0
				fs.createReadStream(filepath)
					.on('data', function (chunk) {
						for (i = 0; i < chunk.length; ++i) if (chunk[i] == 10) count++
					})
					.on('end', function () {
						res(count)
					})
			})
		}
		var count = await countLines(path.resolve(__dirname + '/../bot.js'))
		count += await countLines(path.resolve(__dirname + '/../res/Helpers.js'))
		var files_count = 2

		let cmds = fs
			.readdirSync(__dirname, { withFileTypes: true })
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name)
		for (let cmd of cmds) {
			count += await countLines(__dirname + `/${cmd}`)
			files_count++
		}

		let groups = fs
			.readdirSync(__dirname, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => dirent.name)
		for (let group of groups) {
			let files = fs
				.readdirSync(__dirname + `/${group}`, { withFileTypes: true })
				.filter(dirent => dirent.isFile())
				.map(dirent => dirent.name)
			for (let filename of files) {
				count += await countLines(__dirname + `/${group}/${filename}`)
				files_count++
			}
		}
		console.log(count, files_count)
		msg.channel.send(`My code currently consists of **${count}** lines divided between **${files_count}** files.`)
	},
}
