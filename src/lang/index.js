const fs = require('fs')
const langs = ["zh", "en"]
const configPath = require("node:path").join(require("node:os").homedir(), ".")
class Lang {
  currenyLang;
  init() {
    try {
      this.currenyLang = fs.readFileSync(configPath, "utf-8")
    } catch {
      this.currenyLang = langs[0]
    }
  }
  set(newLang) {
    if (langs.includes(newLang)) {
      fs.writeFileSync(configPath, newLang);
      this.currenyLang = newLang;
      return true;
    }
    return false;
  }
  get() {
    try {
      return require(`./${this.currenyLang}.js`)
    } catch {
      return require(`./${this.currenyLang = langs[0]}.js`)
    }
  }
}
function Export(lang) {
  const obj = lang.get()
  // 用原型来让导入后切换语言不需要再次导入，相同引用
  Object.setPrototypeOf(module.exports, {
    ...obj,
    __internal: {
      class: lang,
      set: (newLang) => {
        lang.set(newLang)
        Export(lang, obj)
      }
    }
  })
}
const lang = new Lang()
lang.init()
module.exports = {};
Export(lang)