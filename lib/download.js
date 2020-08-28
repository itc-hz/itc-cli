const download = require("download-git-repo")
const ora = require("ora")
const path = require("path")
const config = require("../lib/config")

function getDownloadUrlByType(type) {
    let index
    console.log(type)
    console.log(config.choices)
    config.choices.forEach((e, i) => {
        if (e.toLocaleLowerCase() === type.toLocaleLowerCase()) {
            index = i
        }
    })
    //  = config.choices.indexOf(type.toString())
    console.log(index)
	index = index <= -1 ? 0 : index
	return config.downloadUrl[index]
}

module.exports = function ({ target, type }) {
	const url = getDownloadUrlByType(type)
	console.log(url)
	target = path.join(target || ".", ".download-temp")
	return new Promise((resolve, reject) => {
		const spinner = ora(`downloading template`)
		spinner.start()
		download(url, target, { clone: true }, (err) => {
			if (err) {
				spinner.fail()
				reject(err)
			} else {
				spinner.succeed()
				resolve(target)
			}
		})
	})
}
