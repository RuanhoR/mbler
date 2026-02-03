import fs from "node:fs"
import ZhLang from "./zh.js"
import enLang from "./en.js"
import path from "node:path"
const langs = ["zh", "en"]
const configPath = path.join(require("node:os").homedir(), ".cache/mbler/.lang.db")
class Lang {
  currenyLang: "zh" | "en" = "zh";
  init() {
    try {
      const TheyLang = fs.readFileSync(configPath, "utf-8").toString().trim()
      if (TheyLang == "zh" || TheyLang == "en") {
        this.currenyLang = TheyLang
      } else {
        throw new Error("[setup lang]: set lang error")
      }
    } catch {
      this.currenyLang = "zh"
    }
  }
  set(newLang: "zh" | "en") {
    if (langs.includes(newLang)) {
      if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), {
          recursive: true
        })
      }
      fs.writeFileSync(configPath, newLang);
      this.currenyLang = newLang;
      return true;
    }
    return false;
  }
  async get() {
    try {
      if (this.currenyLang == "zh") return ZhLang
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

export function cleanFinally(arg0: string, cleanFinally: any) {
  throw new Error('Function not implemented.')
}
export function s0(s0: any) {
  throw new Error('Function not implemented.')
}

