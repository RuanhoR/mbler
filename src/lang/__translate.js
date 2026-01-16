const fs = require('fs')
// 请确保开启了这个翻译服务器
const API = "http://localhost:8000/translate";
const MAX_RETRY = 5;
const DELAY = 500;

async function main() {
  const [, , srcFile, dstFile, lang] = process.argv;
  if (!srcFile || !dstFile || !lang) {
    console.error("Usage: node translate-json.js zh_CN.json en_US.json en");
    process.exit(1);
  }

  // ---------- 工具函数 ----------
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function flatten(obj, prefix = "", out = {}) {
    for (const k in obj) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === "object" && obj[k] !== null) {
        flatten(obj[k], key, out);
      } else {
        out[key] = String(obj[k]);
      }
    }
    return out;
  }

  function unflatten(map) {
    const obj = {};
    for (const k in map) {
      k.split(".").reduce((o, p, i, arr) => {
        if (i === arr.length - 1) o[p] = map[k];
        else o[p] ??= {};
        return o[p];
      }, obj);
    }
    return obj;
  }

  async function translate(text) {
    if (typeof text === "object") {
      const r = {};
      for (let i in Object.keys(text)) {
        const rel = await translate(text[i])
        r[i] = rel
      }
      return r
    }
    for (let i = 1; i <= MAX_RETRY; i++) {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            to: lang
          })
        });

        const json = await res.json();
        if (json?.status && json.translatedText) {
          return json.translatedText;
        }
      } catch {}

      console.warn(`⚠️ retry ${i}/${MAX_RETRY}`);
      await sleep(DELAY * i);
    }

    throw new Error("Translation failed after retries");
  }

  // ---------- 主流程 ----------
  const src = require(`./${srcFile}`);
  const dst = require(`./${dstFile}`)

  const flatSrc = flatten(src);
  const flatDst = flatten(dst);

  const keys = Object.keys(flatSrc).filter(k => !flatDst[k]);
  console.log(`🔍 need translate: ${keys.length}`);

  for (const k of keys) {
    const text = flatSrc[k];
    console.log(`🌐 ${k}: ${text}`);

    try {
      flatDst[k] = Array.isArray(text) ? text : await translate(text);
      await sleep(DELAY); // 控速，防封
    } catch (e) {
      console.error(`❌ failed: ${k}`);
      flatDst[k] = text; // 兜底：保留原文
    }
  }

  fs.writeFileSync(
    dstFile,
    JSON.stringify(unflatten(flatDst), null, 2)
  );
}
main().then(() => console.log("✅ done"));