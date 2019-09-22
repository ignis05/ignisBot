config = require('../data/config.json')

module.exports = {
	checkPerms: function(uid, perm, guildID) {
		//return true if user has permisssion
		if (perm == 'ignis') {
			return uid == 226032144856776704
		}

		let user = config[guildID].perms[perm].find(o => o.id == uid) //if specified perms

		if (config[guildID].perms.admin.find(o => o.id == uid)) user = true //overwrite for admins
		if (uid == 226032144856776704) user = true //overwrite for ignis

		if (user) {
			console.log('permission granted'.green)
			return true
		} else {
			console.log('permission denied'.red)
			return false
		}
	},
	getUserFromId: function(uID, msg) {
		return msg.guild.members.get(uID).user
	},
	saveConfig: function(channel, reply) {
		fs.writeFile('./data/config.json', JSON.stringify(config, null, 2), err => {
			if (err) console.log(err)
			console.log('modified config.json'.green)
			if (reply) {
				channel.send(reply)
			}
		})
	},
	config: config,
}