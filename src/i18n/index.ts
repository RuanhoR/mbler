import fs from "node:fs";
import ZhLang from "./zh.js";
import enLang from "./en.js";
import path from "node:path";
import { language, LanguageNames } from "../types.js";
const configPath = path.join(
  require("node:os").homedir(),
  ".cache/mbler/lang.db",
);
function isLanguareName(
  language: string,
): language is (typeof LanguageNames)[number] {
  return LanguageNames.includes(language);
}
class Lang {
  currenyLang: (typeof LanguageNames)[number] = "zh";
  init() {
    try {
      const TheyLang = fs.readFileSync(configPath, "utf-8").toString().trim();
      if (isLanguareName(TheyLang)) {
        this.currenyLang = TheyLang;
      } else {
        throw new Error("[setup lang]: set lang error");
      }
    } catch {
      this.currenyLang = "zh";
    }
  }
  set(newLang: (typeof LanguageNames)[number]) {
    if (LanguageNames.includes(newLang)) {
      if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), {
          recursive: true,
        });
      }
      fs.writeFileSync(configPath, newLang);
      this.currenyLang = newLang;
      return true;
    }
    return false;
  }
  async get() {
    try {
      if (this.currenyLang == "zh") return ZhLang;
      return enLang;
    } catch {
      return ZhLang;
    }
  }
}
interface lang extends language {
  __internal: {
    class: Lang;
    set: (newLang: (typeof LanguageNames)[number]) => void;
  };
}
let exp: lang = {
  ...ZhLang,
  __internal: {} as any,
};
async function Export(lang: Lang) {
  const obj = await lang.get();
  // 用原型来让导入后切换语言不需要再次导入，相同引用
  Object.setPrototypeOf(exp, {
    ...obj,
    __internal: {
      class: lang,
      set: (newLang: (typeof LanguageNames)[number]) => {
        lang.set(newLang);
        Export(lang);
      },
    },
  });
}
const lang = new Lang();
lang.init();
Export(lang);
export default exp;
