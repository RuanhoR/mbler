import fs from "node:fs"
import ZhLang from "./zh.js"
import enLang from "./en.js"
import { defaultMaxListeners } from "node:events"
const langs = ["zh", "en"]
const configPath = require("node:path").join(require("node:os").homedir(), ".")
class Lang {
  currenyLang: "zh" | "en" = "zh";
  init() {
    try {
      const TheyLang = fs.readFileSync(configPath, "utf-8")
      if (TheyLang == "zh" || TheyLang == "en") this.currenyLang = TheyLang
      throw new Error("[setup lang]: set lang error")
    } catch {
      this.currenyLang = "zh"
    }
  }
  set(newLang: "zh" | "en") {
    if (langs.includes(newLang)) {
      fs.writeFileSync(configPath, newLang);
      this.currenyLang = newLang;
      return true;
    }
    return false;
  }
  async get() {
    try {
      if (this.currenyLang == "zh")  return ZhLang
      return enLang
    } catch {
      return ZhLang
    }
  }
}
let exp: any = {}
async function Export(lang: Lang) {
  const obj = await lang.get()
  // 用原型来让导入后切换语言不需要再次导入，相同引用
  Object.setPrototypeOf(exp, {
    ...obj,
    __internal: {
      class: lang,
      set: (newLang: "zh" | "en") => {
        lang.set(newLang)
        Export(lang)
      }
    }
  })
}
const lang = new Lang()
lang.init()
Export(lang)
export default exp