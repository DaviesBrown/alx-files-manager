const { randomUUID } = require("crypto");
const fs = require("fs")
const path = '/tmp/files_manager'
const filePath = `${path}/${randomUUID()}`;
const content = atob('SGVsbG8gV2Vic3RhY2shCg==');

fs.writeFile(filePath, content, (err) => {
    if (err) throw err;
    console.log('Replaced!');
});