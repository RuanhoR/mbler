import * as fs from 'fs/promises';
import lang from './../lang/index.js';
import path from 'path';

export = async function rechce(dirname: string, workDir: string): Promise<void> {
  await Promise.all([
    fs.rm(path.join(dirname, "lib/data/path.db"), {
      recursive: true,
      force: true
    }).catch(() => {}),
    fs.rm(path.join(dirname, "lib/initializer-cache/"), {
      recursive: true,
      force: true
    }).catch(() => {}),
    fs.rm(path.join(dirname, "lib/data/cache"), {
      recursive: true,
      force: true
    }).catch(() => {})
  ]);
  console.log(lang.s0);
};