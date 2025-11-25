const fs = require('fs/promises');
const path = require('path');
const utils = require('./../utils');
const ImportManager = require('./c-handler-export')
const {
  minify
} = require('terser');
let gamelib_module = require('./../build/getModule');
let gamelib_modules;
let forInscript = false;
/**
 * 替换模块 import 路径
 * @param {String} code - 文件内容
 * @param {Array<String>} modules - 所有模块名组成的数组
 * @param {String} targetDir - 目标文件目录
 * @param {String} sourceDir - Script Project目录
 * @return {String} - 替换后的源码字符串
 */
async function replaceModuleImports(
  code,
  modules,
  targetDir,
  sourceDir
) {
  const im = ImportManager(code);
  if (Array.isArray(modules)) {
    const imports = im.get();
    if (imports.length < 1) return code;
    for (const item of modules) {
      const moduleDir = await gamelib_modules.getDir(item);
      // 这里由于 utils.handlerPackage 做了校验，这里直接取值即可
      const main = (await utils.handlerPackage(moduleDir)).main;
      // 模块路径
      const relPath = path
        .relative(
          path.dirname(targetDir),
          path.join(
            sourceDir,
            'node_modules',
            path.basename(moduleDir),
            main
          )
        )
        .split(path.sep).join('/');
      // 寻找目标项
      const found = imports
        .find(imp => imp.ModuleName === item);
      if (found) im.set({
        ModuleName: `./${relPath}`,
        ImportItem: found.ImportItem
      });
    }
  }
  // 返回结果
  return im.generate();
}

/**
 * 处理单个文件
 */
async function processFile(filePath, modules, sourceDir, is) {
  try {
    const ext = path.extname(filePath).slice(1);
    const code = await utils.readFile(filePath);
    switch (ext) {
      case 'js':
        let replaced = await replaceModuleImports(
          code,
          modules,
          filePath,
          sourceDir
        );
        if (is === true) {
          const result = await minify(replaced);
          if (result.code) {
            replaced = result.code
          }
        }
        await fs.writeFile(filePath, replaced, 'utf-8');
        break;

      case 'json':
        if (!forInscript) break;
        let re = code;
        if (is === true) {
          const json = utils.JSONparse(code);
          re = JSON.stringify(json);
        }
        // 让可以被 js 导入
        await Promise.all([
          fs.writeFile(`${filePath}.js`, `export const data=${re}`),
          fs.rm(filePath, {
            recursive: true,
            force: true
          })
        ]);
        break;
      case 'map':
      case 'ts':
        fs.rm(filePath, {
          recursive: true,
          force: true
        })
        break;
    }
  } catch (err) {
    console.log(filePath, err.message)
  }
}

/**
 * 递归遍历并处理文件
 */
async function processDir(targetDir, modules, sourceDir, baseDir, is) {
  const stat = await fs.stat(targetDir);
  gamelib_modules = await gamelib_module(baseDir)
  let inScriptTemp = false;
  if (stat.isDirectory()) {
    const files = await fs.readdir(targetDir);
    if (path.basename(targetDir) === "scripts") {
      forInscript = true;
      inScriptTemp = true;
    }
    for (const file of files) {
      await processDir(
        path.join(targetDir, file),
        modules,
        sourceDir,
        baseDir,
        is
      );
    }
    if (forInscript && inScriptTemp) forInscript = false;
  } else if (stat.isFile()) {
    await processFile(targetDir, modules, sourceDir, is);
  } else {
    console.warn(`跳过未知类型:${targetDir}`);
  }
}

module.exports = processDir;