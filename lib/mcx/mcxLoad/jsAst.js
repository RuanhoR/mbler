const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const fs = require("fs/promises")
module.exports = class jsAst {
  constructor(file, opt = {}) {
    this.file = file;
    this.opt = {
      ts: false,
      ...opt
    }
  }
  generate() {
    
  }
}