#!/user/bin/env node

const program = require("commander")
const path = require("path")
const glob = require("glob")
const fs = require("fs")
const download = require("../lib/download")
const inquirer = require("inquirer")
const latestVersion = require("latest-version")
const generator = require("../lib/generator")
const chalk = require("chalk")
const logSymbols = require("log-symbols")
const config = require('../lib/config')

program.usage("<project-name>").parse(process.argv)
// console.log(program)
let projectName = program.args[0]

if (!projectName) {
	program.help()
	return
}

const list = glob.sync("*")
// console.log("list", list)
let rootName = path.basename(process.cwd())
// console.log("rootName", rootName)
let next
if (list.length) {
	const _file = list.filter((name) => {
		const fileName = path.resolve(process.cwd(), path.join(".", name))
		const isDir = fs.statSync(fileName).isDirectory()
		return name.indexOf(projectName) !== -1 && isDir
	})
	// console.log("_file", _file)
	if (_file && _file.length > 0) {
		console.log(`项目${projectName}已经存在`)
		return
	}
	next = Promise.resolve(projectName)
} else if (rootName === projectName) {
	next = inquirer
		.prompt([
			{
				name: "buildInCurrent",
				message: "当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？",
				default: true,
				type: "confirm"
			}
		])
		.then((answer) => {
			return Promise.resolve(answer.buildInCurrent ? "." : projectName)
		})
} else {
	next = Promise.resolve(projectName)
}

next && go()

function go() {
	console.log(path.resolve(process.cwd(), path.join(".", rootName)))

	next.then((projectRoot) => {
		if (projectRoot !== ".") {
			fs.mkdirSync(projectRoot)
		}
		return inquirer
			.prompt([
				{
					type: "list",
					name: "type",
					message: "What template do you need?",
					choices: config.choices,
					filter: function (val) {
						return val.toLowerCase()
					}
				},
				{
					name: "projectName",
					message: "项目的名称",
					default: projectRoot
				},
				{
					name: "projectVersion",
					message: "项目的版本号",
					default: "1.0.0"
				},
				{
					name: "projectDescription",
					message: "项目的简介",
					default: `A project named ${projectRoot}`
				},
				{
					name: 'projectAuthor',
					message: '创建人',
					default: `me`
				}
			])
			.then((answers) => {
				console.log(answers)
				return download({target: projectRoot, type: answers.type}).then((target) => {
					const context = {
						name: projectRoot,
						root: projectRoot,
						downloadTemp: target
					}
					return {
						...context,
						metadata: {
							...answers
						},
						src: context.downloadTemp,
						dest: context.projectRoot
					}
				})
			})
			.then((context) => {
				// console.log(context)
				return generator(context, context.src)
			})
			.then((context) => {
				console.log(logSymbols.success, chalk.bgCyan("创建成功:)"))
				console.log(logSymbols.success,chalk.bgCyan("\nCongratulations!!! Next step..⬇\n"))
				console.log(chalk.bgCyan("cd " + context.root + "\nnpm install\nnpm run dev"))
			})
			.catch((err) => console.error(logSymbols.error, chalk.red(`创建失败：${err.message}`)))
	})
}
