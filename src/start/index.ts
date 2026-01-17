import fs from 'node:fs/promises'
import char from './../lang/index.js'
import path from 'node:path'
import * as utils from './../utils/index.js'
const db = 'lib/data/path.db'
import "./../commander/index.js"
import process from 'node:process'
class start {
  command: string
  two: string
  param: string
  dirname: string;
  DataPath: string;
  constructor(dir: string) {
    this.dirname = dir
    this.param = ""
    this.DataPath = path.join(this.dirname, db)
    this.command = process.argv[2] || '';
    this.two = (process.argv[3] || '').trim();
    this.start();
  }
  v = () => {
    const {
      version: v
    } = require('./../../package.json')
    console.log(`MBLER : ${v}`)
  }
  build = async () => {
    const Bulid = require('./../build')
    const build = new Bulid(this.param, this.dirname)
    await build.build()
  }
  help = () => {
    const cmds = char.commands;
    if (cmds.list.includes(this.two) && typeof cmds[this.two] === "string") {
      let cmd = cmds[this.two];
      if (cmd.startsWith("$")) cmd = cmds[cmd.slice(1)]
      console.log(`-- '${this.two}' command -- : \n`)
      console.log(`Usage : ${cmd}`)
      return;
    }
    this.echoHelp();
  }
  checkout = async () => {
    if (this.two) this.two = utils.join(process.cwd(), this.two || './')
    if (!(await utils.FileExsit(this.two)) || !this.two || this.param === this.two) {
      console.log(this.param)
      return;
    }
    await fs.writeFile(this.DataPath, this.two)
    console.log(char.s0, `PATH => ${this.two}`)
  }
  init = () => {
    const Init = require('./init.js')
    const init = new Init(this.param, this.dirname)
    return init.start();
  }
  async start(): Promise<void> {
    await this.getWorkDir()
    const commandcc = this.command.toLowerCase().trim()
    const commandMap: {[key: string]: Function | void} = {
      build: this.build,
      dev: () => require('./dev')(this.param, this.dirname),
      create: () => require('./create')(this.param, this.dirname, this.two),
      "": () => this.echoHelp(),
      recache: () => require('./rechce')(this.dirname, this.param),
      lang: () => {
        if (this.two) char.__internal.set(this.two);
        console.log(char.__internal.class.currenyLang)
      },
      "-h": this.help,
      "-help": this.help,
      "help": this.help,
      version: () => {
        const version = require('./version.js')
        new version(this.param, this.dirname);
      },
      "v": this.v,
      "-v": this.v,
      checkout: this.checkout,
      "-c": this.checkout,
      init: this.init,
      "-i": this.init,
      "web_edit": () => {
        const edit = require('./../web')
        new edit({
          PORT: 1025,
          PATH: this.param
        })
      },
      install: async () => require('./incg.js')(this.dirname, this.param),
      uninstall: () => require('./unincg.js')(this.two, this.dirname),
      add: () => require('./addPack.js')(this.two, this.dirname, this.param),
      remive: () => require('./unaddPack.js')(this.two, this.dirname, this.param),
      clean: async () => {
        const clean = require('./clean.js')
        await (new clean(this.param, this.dirname)).run()
      }
    }
    const run = commandMap[commandcc];
    try {
      if (typeof run === "function") {
        const i = run()
        if (i instanceof Promise) await i;
      } else {
        this.defaultCommand(commandcc)
      }
      process.exit(0);
    } catch (err) {
      console.error(err)
    }
  }
  defaultCommand(commandcc: string): void {
    console.log(`\x1b[31m${char.uncommand}: ${this.command.toLowerCase().trim()}\x1b[0m`)
    const didvalue = char.commands.list.map((item: string): number => this.getMatchChance(commandcc, item)).reduce((acc: {max: number, index: number, indices: number[]}, cur: number, index: number) => {
      try {
        if (cur > acc.max) {
          return {
            max: cur,
            index: index
          }; // 更新最大值及索引
        } else if (cur === acc.max) {
          acc.indices.push(index); // 记录重复最大值的索引
          return acc;
        }
      } catch {}
      return acc;
    }, {
      max: -Infinity,
      index: -1,
      indices: []
    });
    const value = char.commands.list[didvalue.index];
    if (value) console.log(`${char.noCommandTip} ${value}`)
  }
  async getWorkDir() {
    try {
      this.param = (
        await fs.readFile(this.DataPath, 'utf-8')
      ).toString() || "./test"
    } catch (err) {}
  }
  echoHelp() {
    console.log(char.help)
  }
  getMatchChance(a: string, b: string): number {
    let match = 0;
    // b = 比较值，a = 待比较值
    for (let i = 0; i < b.length; i++) {
      if (a[i] == b[i]) match++
    }
    return match / b.length;
  }
}
module.exports = start;