const TagAST = require('./../ast');
const ERRORS = require('./../errors')
const RunInVm = require('./../../runTemp/script')
const fs = require('fs/promises')
const Temp = require('./../../runTemp')
const path = require("path")
const McxLoad = require("./load")
const JSAst = require('./jsAst')
module.exports = class MCXLoad {
  dir;
  constructor(dir) {
    this.dir = dir;
    this.temp = new Temp(path.join(__dirname, './../../data/cache'))
  }
  async run() {
    await this.temp.init();
    const fileList = await this.findAllMcxFile([], "./");
    if (fileList.length < 1) {
      throw new Error("No need compile File")
    }
    const outFileList = await this.CopyMcxFile(fileList);
    this.runLoad(outFileList)
  }
  async runLoad(fileList) {
    const cache = new Map();
    const Component = new Map();
    const Event = new Map();
    const mcxLoad = new McxLoad({
      Event,
      Component,
      cache
    });
    for (let file of fileList) {
      const ext = path.extname(file);
      switch (ext.slice(1)) {
        case "mcx":
          mcxLoad.load(file)
          break;
        case "js":
          const ast = new JSAst(file);
          const data = await ast.generate();
          cache.set(file, {
            raw: data,
            type: "jsUtils"
          })
          break;
        case "ts":
          const ast = new JSAst(file, {
            ts: true
          });
          const data = await ast.generate();
          cache.set(file, {
            raw: data,
            type: "jsUtils"
          })
          break;
      }
    }
  }
  async findAllMcxFile(source, dir) {
    const files = await fs.readdir(path.join(this.dir, dir), {
      withFileTypes: true
    }).catch(() => []);
    await Promise.all(files.map(async (file) => {
      if (file.isFile()) {
        if ([".mcx", ".js", ".ts"].includes(path.extname(file.name))) source.push(path.join(dir, file.name))
      } else {
        await this.findAllMcxFile(source, path.join(dir, file.name))
      }
    }))
    return source
  }
  CopyMcxFile(FileList) {
    return Promise.all(
      FileList.map(async item => {
        // 源文件
        const src = path.join(this.dir, item);
        const out = path.join(this.temp.dir, item);
        await fs.cp(src, out, {
          force: true,
          recursive: true
        })
        return out;
      })
    );
  }
  Deconstruct(t) {
    const r = {
      script: {},
      Event: {},
      Component: {}
    };
    const ast = new TagAST(t);
    for (let el of ast.generateAst()) {
      if (["script", "Event", "Component"].includes(el.name)) r[el.name] = el;
    };
    if (r.script.content === void 0) throw ERRORS.nosc
    return r
  }
}