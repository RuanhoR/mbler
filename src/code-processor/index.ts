import * as fs from 'fs/promises';
import * as path from 'path';
import * as utils from '../utils/index.js';
import imn from './c-handler-export';
import { minify } from 'terser';
import getModule from '../build/getModule.js';
import { AnyCnameRecord } from 'dns';

interface ProcessOptions {
  modules?: string[];
  sourceDir: string;
  baseDir: string;
  minify?: boolean;
}

let gamelib_modules: any;
let forInscript = false;

/**
 * 替换模块 import 路径
 */
async function replaceModuleImports(
  code: string,
  modules: string[],
  targetDir: string,
  sourceDir: string
): Promise<string> {
  const im = imn(code);
  if (Array.isArray(modules)) {
    const imports = im.get();
    if (imports.length < 1) return code;
    for (const item of modules) {
      const moduleDir = await gamelib_modules.getDir(item);
      const main = (await utils.handlerPackage(moduleDir)).main;
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
      const found = imports.find((imp: any) => imp.ModuleName === item);
      if (found) im.set({
        ModuleName: `./${relPath}`,
        ImportItem: found.ImportItem
      });
    }
  }
  return im.generate();
}

/**
 * 处理单个文件
 */
async function processFile(
  filePath: string, 
  modules: string[], 
  sourceDir: string, 
  shouldMinify?: boolean
): Promise<void> {
  try {
    const ext = path.extname(filePath).slice(1);
    const code = await fs.readFile(filePath, "utf-8");
    
    switch (ext) {
      case 'js':
        let replaced = await replaceModuleImports(code, modules, filePath, sourceDir);
        if (shouldMinify === true) {
          const result = await minify(replaced);
          if (result.code) replaced = result.code;
        }
        await fs.writeFile(filePath, replaced, 'utf-8');
        break;

      case 'json':
        let re = code;
        if (shouldMinify === true) {
          const json = utils.JSONparse(code);
          re = JSON.stringify(json);
          if (forInscript) {
            await Promise.all([
              fs.writeFile(`${filePath}.js`, `export const data=${re}`),
              fs.rm(filePath, { recursive: true, force: true })
            ]);
          }
        }
        break;
        
      case 'map':
      case 'ts':
        await fs.rm(filePath, { recursive: true, force: true });
        break;
    }
  } catch (err) {
    console.log(filePath, (err as Error).message);
  }
}

/**
 * 递归遍历并处理文件
 */
async function processDir(
  targetDir: string,
  modules: string[],
  sourceDir: string,
  baseDir: string,
  shouldMinify?: boolean
): Promise<void> {
  const stat = await fs.stat(targetDir);
  gamelib_modules = await getModule(baseDir);
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
        shouldMinify
      );
    }
    if (forInscript && inScriptTemp) forInscript = false;
  } else if (stat.isFile()) {
    await processFile(targetDir, modules, sourceDir, shouldMinify);
  } else {
    console.warn(`跳过未知类型:${targetDir}`);
  }
}

export default async function processor(
  targetDir: string,
  options: ProcessOptions
): Promise<void> {
  await processDir(
    targetDir,
    options.modules || [],
    options.sourceDir,
    options.baseDir,
    options.minify
  );
}