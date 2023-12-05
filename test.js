const mime = require("mime-types")

const me = mime.contentType('me.png')
console.log(me)