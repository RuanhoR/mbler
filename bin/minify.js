#!/usr/bin/env node

const {
  minify
} = require('terser');
const path = require('node:path');
const fs = require('node:fs/promises');

// 配置 base 目录（脚本所在目录的上一级）
const base = path.join(__dirname, "./../");

// 排除的目录名（比如 .git、.DS_Store 等，可根据需要扩展）
const excludedDirs = ['.git', ".DS_Store", ".github"];

function isExcludedDir(targetPath) {
  const dirs = targetPath.split(path.sep);
  return excludedDirs.some(dir => dirs.includes(dir));
}
const processDir = async (relativeDir) => {
  const fullPath = path.join(base, relativeDir);
  try {
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(fullPath);
      if (isExcludedDir(relativeDir)) {
        console.log(`[跳过目录] ${relativeDir}`);
        return;
      }
      let run = [];
      for (const file of files) {
        const nextRelativePath = path.join(relativeDir, file);
        run.push(processDir(nextRelativePath)); // 递归处理下一层
      }
      await Promise.all(run);
    } else if (stat.isFile()) {
      await processFile(relativeDir); // 处理文件
    }
  } catch (err) {
    console.error(`无法处理路径 [${fullPath}]:`, err.message);
  }
};
const processFile = async (relativeFilePath) => {
  const fullPath = path.join(base, relativeFilePath);
  const ext = path.extname(relativeFilePath).slice(1);
  const code = await fs.readFile(fullPath, 'utf-8');
  try {
    if (['mjs', 'cjs', 'js'].includes(ext)) {
      // 尝试压缩 JS 文件
      let result = {};
      try {
        result = await minify(code);
      } catch (err) {
        console.warn(`[Terser 压缩失败] ${relativeFilePath} ${err.stack}`);
      }
      const outputCode = result.code || code; // 压缩失败时使用原代码
      const distFilePath = path.join(base, 'dist', relativeFilePath);
      const distDir = path.dirname(distFilePath);
      await fs.mkdir(distDir, {
        recursive: true
      });
      fs.writeFile(distFilePath, outputCode, 'utf-8');
    } else if (ext === "json") {
      let result = '';
      try {
        result = JSON.stringify(JSON.parse(code));
      } catch (err) {
        result = code;
      }
      const distFilePath = path.join(base, 'dist', relativeFilePath);
      const distDir = path.dirname(distFilePath);
      await fs.mkdir(distDir, {
        recursive: true
      });
      fs.writeFile(distFilePath, result, 'utf-8');
    } else {
      const distFilePath = path.join(base, 'dist', relativeFilePath);
      const distDir = path.dirname(distFilePath);
      await fs.mkdir(distDir, {
        recursive: true
      });
      fs.writeFile(distFilePath, code, 'utf-8');
    }
  } catch (err) {
    console.error(`处理文件失败 [${relativeFilePath}]:`, err.message);
  }
};
(async () => {
  try {
    await fs.rm(path.join(base, `dist`), {
      recursive: true,
      force: true
    })
  } catch (err) {
    console.log(err)
  }
  await processDir('./');
})()