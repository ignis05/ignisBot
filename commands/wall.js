module.exports = {
	name: 'wall',
	categories: ['text', 'dm'],
	desc: `responds with wall of line breaks`,
	help: '`wall` - will respond with wall of line breaks',
	run: msg => {
		// uses mongolian vowel separator betwwen \n
		msg.channel.send('\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n᠎\n')
	},
}
