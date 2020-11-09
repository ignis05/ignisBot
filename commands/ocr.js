const { recognize } = require('tesseract.js')

module.exports = {
	name: 'ocr',
	categories: ['text', 'dm'],
	aliases: ['imgtotext', 'tesseract'],
	desc: 'extracts text from image',
	help: '`ocr <url> [lang]` - reads image from url\n`ocr [lang]` - if message has an attachment, it reads from attachment instead',
	run: async msg => {
		const sendmessage = text => msg.channel.send(`Recognized text from ${msg.author}'s message:\n\`\`\`${text}\`\`\``, { disableMentions: 'everyone', allowedMentions: { users: [] } })
		const errorhandler = err => msg.channel.send('Failed to read image')
		let attachment = msg.attachments.first()
		if (attachment) {
			let arg = msg.content.split(' ').slice(1)[0]
			recognize(attachment.attachment, arg || 'pol', { errorHandler: errorhandler, cachePath: './data/tesseract' }).then(res => {
				sendmessage(res.data.text)
			})
		} else {
			let arg = msg.content.split(' ').slice(1)[0]
			let arg1 = msg.content.split(' ').slice(1)[1]
			console.log(arg)
			recognize(arg, arg1 || 'pol', { errorHandler: errorhandler, cachePath: './data/tesseract' }).then(res => {
				sendmessage(res.data.text)
			})
		}
	},
}
