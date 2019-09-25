config = require('../data/config.json')
const fs = require('fs')

module.exports = {
	saveConfig: function(channel, reply) {
		return new Promise((res, rej) => {
			console.log('saving config')
			fs.writeFile('./data/config.json', JSON.stringify(config, null, 2), err => {
				if (err) {
					console.log(err)
					rej(err)
				} else {
					console.log('modified config.json'.green)
					if (reply) {
						channel.send(reply)
					}
					res('ok')
				}
			})
		})
	},
	fetchCommands: function(log) {
		if (log === undefined) log = true
		const commands = {}
		if (log) console.log('Loading commands from files:'.accent)
		let groups = fs
			.readdirSync(__dirname + '/../commands/', { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => dirent.name)

		for (let group of groups) {
			commands[group] = []
		}

		let multi_cmds = fs
			.readdirSync(__dirname + '/../commands/', { withFileTypes: true })
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name)
		for (let cmd of multi_cmds) {
			try {
				let temp = require(__dirname + `/../commands/${cmd}`)
				// validate module.exports
				if (!temp.name || typeof temp.run != 'function' || temp.categories.length < 1) throw 'wrong arguments'
				// set default properties
				if (!temp.aliases) temp.aliases = []

				for (let group of temp.categories) {
					if (log) {
						if (!Object.keys(temp).every(el => ['name', 'aliases', 'run', 'categories', 'desc', 'help'].includes(el))) {
							console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
						} else {
							if (temp.desc && temp.help) console.log(`${group}/${temp.name} - loaded`.green)
							else console.log(`${group}/${temp.name} - loaded, but is missing help info`.warn)
						}
					}
					if (!commands[group]) {
						commands[group] = []
					}
					commands[group].push(temp)
				}
			} catch (err) {
				if (log) console.log(`${cmd} - not loaded, file is invalid`.error)
				if (log) console.log(err)
			}
		}

		for (let group of groups) {
			let files = fs
				.readdirSync(__dirname + `/../commands/${group}`, { withFileTypes: true })
				.filter(dirent => dirent.isFile())
				.map(dirent => dirent.name)
			for (let filename of files) {
				try {
					let temp = require(__dirname + `/../commands/${group}/${filename}`)
					// validate module.exports
					if (!temp.name || typeof temp.run != 'function') throw 'wrong arguments'
					if (log) {
						if (!Object.keys(temp).every(el => ['name', 'aliases', 'run', 'desc', 'help'].includes(el))) {
							console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
						} else {
							if ((temp.desc && temp.help) || group == 'absolute') console.log(`${group}/${temp.name} - loaded`.green)
							else console.log(`${group}/${temp.name} - loaded, but is missing help info`.warn)
						}
					}

					// set default properties
					if (!temp.aliases) temp.aliases = []

					commands[group].push(temp)
				} catch (err) {
					if (log) console.log(`${filename} - not loaded, file is invalid`.error)
					if (log) console.log(err)
				}
			}
		}

		return commands
	},
	config: config,
}
