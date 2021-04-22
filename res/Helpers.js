config = require('../data/config.json')
const fs = require('fs')
const path = require('path')

module.exports = {
	countLines: function () {
		return new Promise(async res => {
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
			// manually load files
			var count = await countLines(path.resolve(__dirname + '/../bot.js'))
			count += await countLines(path.resolve(__dirname + '/Helpers.js'))
			count += await countLines(path.resolve(__dirname + '/client.js'))
			var files_count = 3

			// auto load commands
			const cmdDir = path.join(__dirname + '/../commands')
			let cmds = fs
				.readdirSync(cmdDir, { withFileTypes: true })
				.filter(dirent => dirent.isFile())
				.map(dirent => dirent.name)
			for (let cmd of cmds) {
				count += await countLines(cmdDir + `/${cmd}`)
				files_count++
			}

			let groups = fs
				.readdirSync(cmdDir, { withFileTypes: true })
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name)
			for (let group of groups) {
				let files = fs
					.readdirSync(cmdDir + `/${group}`, { withFileTypes: true })
					.filter(dirent => dirent.isFile())
					.map(dirent => dirent.name)
				for (let filename of files) {
					count += await countLines(cmdDir + `/${group}/${filename}`)
					files_count++
				}
			}
			console.log(count, files_count)
			res({ lines: count, files: files_count })
		})
	},
	formatTime: function (time) {
		var hrs = ~~(time / 3600)
		var mins = ~~((time % 3600) / 60)
		var secs = ~~time % 60

		var ret = ''
		if (hrs > 0) {
			ret += '' + hrs + ':' + (mins < 10 ? '0' : '')
		}
		ret += '' + mins + ':' + (secs < 10 ? '0' : '')
		ret += '' + secs
		return ret
	},
	saveConfig: function (channel, reply) {
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
	fetchCommands: function (log) {
		if (log === undefined) log = true
		const commands = {}
		var errors = false
		var noHelp = false
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
				if (typeof temp.run != 'function') throw 'module.run is not a function'
				if (!temp.name) throw 'module.name is undefined'
				if (temp.categories.length < 1) throw 'module.categories is empty or undefined'
				// set default properties
				if (!temp.aliases) temp.aliases = []

				for (let group of temp.categories) {
					if (log) {
						if (!Object.keys(temp).every(el => ['name', 'aliases', 'run', 'categories', 'desc', 'help'].includes(el))) {
							console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
						} else {
							if (temp.desc && temp.help) console.log(`${group}/${temp.name} - loaded`.green)
							else {
								noHelp = true
								console.log(`${group}/${temp.name} - loaded, but is missing help info`.warn)
							}
						}
					}
					if (!commands[group]) {
						commands[group] = []
					}
					commands[group].push(temp)
				}
			} catch (err) {
				errors = true
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
					if (typeof temp.run != 'function') throw 'module.run is not a function'
					if (!temp.name) throw 'module.name is undefined'
					if (log) {
						if (!Object.keys(temp).every(el => ['name', 'aliases', 'run', 'desc', 'help'].includes(el))) {
							console.log(`${group}/${temp.name} - loaded, but has some invalid properties`.warn)
						} else {
							if ((temp.desc && temp.help) || group == 'owner') console.log(`${group}/${temp.name} - loaded`.green)
							else {
								noHelp = true
								console.log(`${group}/${temp.name} - loaded, but is missing help info`.warn)
							}
						}
					}

					// set default properties
					if (!temp.aliases) temp.aliases = []

					commands[group].push(temp)
				} catch (err) {
					errors = true
					if (log) console.log(`${filename} - not loaded, file is invalid`.error)
					if (log) console.log(err)
				}
			}
		}
		if (log) {
			if (errors) console.log("Some files weren't loaded - check errors above for details".redRev)
			else console.log('Everything loaded correctly'.greenRev)
			if (noHelp) console.log('Some files are missing help info'.warn)
		}
		return commands
	},
	fetchInteractions: log => {
		const interactions = []
		let inter_files = fs
			.readdirSync(__dirname + '/../interactions/', { withFileTypes: true })
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name)
		var noDesc = false
		var errors = false
		for (let cmd of inter_files) {
			try {
				let temp = require(__dirname + `/../interactions/${cmd}`)
				// validate module.exports
				if (!temp.commandData) throw 'no commandData found'
				if (!temp.commandData.name) throw 'no name found'
				if (!temp.commandData.description) {
					noDesc = true
					console.log(`${cmd} - loaded, but is missing description`.warn)
				}
				// set default properties
				interactions.push(temp)
			} catch (err) {
				errors = true
				if (log) console.log(`${cmd} - not loaded, file is invalid`.error)
				if (log) console.log(err)
			}
		}
		if (errors) console.log("Some files weren't loaded - check errors above for details".redRev)
		else console.log('Everything loaded correctly'.greenRev)
		if (noDesc) console.log('Some files are missing description'.warn)

		return interactions
	},
	config: config,
	botOwnerID: '226032144856776704',
}
