const TagAST = require('./../ast');
const ERRORS = require('./../errors')
const RunInVm = require('./../../runTemp/script')
// ast
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const typescript = require('typescript')
const fs = require('fs/promises')
const Temp = require('./../../runTemp')
const path = require("path")
class Load {
  constructor(dir, temp) {
    
  }
}
module.exports = class MCXLoad {
  constructor(dir) {
    this.dir = dir;
  }
  async run() {
    const fileList = await this.findAllMcxFile([], "./");
    if (fileList.length < 1) {
      throw new Error("No need compile File")
    }

  }
  async findAllMcxFile(source, dir) {
    const files = await fs.readdir(path.join(this.dir, dir), {
      withFileTypes: true
    });
    for (let file of files) {
      if (file.isFile()) {
        source.push(path.join(this.dir, dir, file.name))
      } else {
        await this.findAllMcxFile(source, path.join(this.dir, dir, file.name))
      }
    }
    return source
  }
  Deconstruct() {
    const r = {
      script: {},
      Event: {},
      Component: {}
    };
    for (let el of this.TAGAST.data) {
      if (["script", "Event", "Component"].includes(el.name)) r[el.name] = el;
    };
    if (r.script.content === void 0) throw ERRORS.nosc
    return r
  }
}