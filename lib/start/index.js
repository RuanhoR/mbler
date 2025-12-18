const fs = require('fs/promises')
const char = require('./../lang')
const path = require('path')
const utils = require('./../utils')
const db = 'lib/data/path.db'
let dirname;
let DataPath;

class start {
  constructor(dir) {
    dirname = dir
    DataPath = path.join(dirname, db)
    this.command = process.argv[2] || '';
    this.two = (process.argv[3] || '').trim();
    process.nextTick(() => this.start())
  }
  async start() {
    await this.getWorkDir()
    const commandcc = this.command.toLowerCase().trim()
    switch (commandcc) {
      case "build":
        const Bulid = require('./../build')
        const build = new Bulid(this.param, dirname)
        await build.build()
        break;
      case "dev":
        require('./dev')(this.param, dirname)
        break;
      case "create":
        require('./create')(this.param, dirname, this.two)
        break;
      case "":
        this.echoHelp();
        break;
      case "rechce":
        require('./rechce')(dirname, this.param)
        break;
      case "lang":
        if (this.two) char.__internal.set(this.two);
        console.log(char.__internal.class.currenyLang)
        break
      case "-h":
      case "-help":
      case "help":
        const cmds = char.commands;
        if (cmds.list.includes(this.two) && typeof cmds[this.two] === "string") {
          let cmd = cmds[this.two];
          if (cmd.startsWith("$")) cmd = cmds[cmd.slice(1)]
          console.log(`-- '${this.two}' command -- : \n`)
          console.log(`Usage : ${cmd}`)
          return;
        }
        this.echoHelp();
        break;
      case "version":
        const version = require('./version.js')
        new version(this.param, dirname);
        break;
      case 'v':
      case '-v':
        const {
          version: v
        } = require('./../../package.json')
        console.log(`MBLER : ${v}`)
        break;
      case 'checkout':
      case '-c':
        this.two = !this.two || utils.join(process.cwd(), this.two || './')
        if (!(await utils.FileExsit(this.two)) || !this.two || this.param === this.two) {
          console.log(this.param)
          break;
        }
        await fs.writeFile(DataPath, this.two, {
          force: true,
          recursive: true
        })
        console.log(char.s0, `PATH => ${this.two}`)
        break;
      case "init":
      case '-i':
        const init = require('./init.js')
        new init(this.param, dirname)
        break;
      case 'web_edit':
        const edit = require('./../web')
        new edit({
          PORT: 1025,
          PATH: this.param
        })
        break;
      case 'install':
        require('./incg.js')(dirname, this.param)
        break;
      case 'uninstall':
        require('./unincg.js')(this.two, dirname)
        break;
      case 'add':
        require('./addPack.js')(this.two, dirname, this.param)
        break;
      case 'remove':
        require('./unaddPack.js')(this.two, dirname, this.param)
        break;
      case 'cln':
      case 'clean':
        const clean = require('./clean.js')
        await (new clean(this.param, dirname)).run()
        break;
      default:
        console.log(`\x1b[31m${char.uncommand}: ${this.command.toLowerCase().trim()}\x1b[0m`)
        const didvalue = char.commands.list.map(item => this.getMatchChance(commandcc, item)).reduce((acc, cur, index) => {
          if (cur > acc.max) {
            return {
              max: cur,
              index: index
            }; // 更新最大值及索引
          } else if (cur === acc.max) {
            acc.indices.push(index); // 记录重复最大值的索引
            return acc;
          }
          return acc;
        }, {
          max: -Infinity,
          index: -1,
          indices: []
        });
        const value = char.commands.list[didvalue.index];
        if (value) console.log(`${char.noCommandTip} ${value}`)
        break;
    }
  }
  async getWorkDir() {
    try {
      this.param = (
        await fs.readFile(DataPath, 'utf-8')
      ).toString() || "./test"
    } catch (err) {}
  }
  echoHelp() {
    console.log(char.help)
  }
  getMatchChance(a, b) {
    let match = 0;
    // b = 比较值，a = 待比较值
    for (let i = 0; i < b.length; i++) {
      if (a[i] == b[i]) match++
    }
    return match / b.length;
  }
}
module.exports = start;