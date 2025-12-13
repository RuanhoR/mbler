const fs = require('fs')
const langs = ["zh_CN", "zh_TW", "en_US"]
const configPath = require('path').join(__dirname, "./../data/lang.db")
class Lang {
  currenyLang;
  init() {
    try {
      this.currenyLang = fs.readFileSync(configPath)
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
    return require(`./${this.currenyLang}.js`)
  }
}
const lang = new Lang()
lang.init()
module.exports = {};
Export(lang, module.exports)
function Export(lang, e) {
  const obj = lang.get()
  for (let key of Object.keys(obj)) {
    e[key] = obj[key]
  }
  e.__internal = {
    class: lang,
    set: (newLang) => {
      lang.set(newLang)
      Export(lang, obj)
    }
  }
}