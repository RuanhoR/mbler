import * as fs from 'fs/promises';
import lang from './../lang/index.js';
import path from 'path';
import { homedir, tmpdir } from 'os';

export = async function rechce(dirname: string, workDir: string): Promise<void> {
  await Promise.all([
    fs.rm(path.join(homedir(), ".cache/mbler"), {
      recursive: true,
      force: true
    }).catch(() => {}),
    fs.rm(path.join(dirname, "lib/initializer-cache/"), {
      recursive: true,
      force: true
    }).catch(() => {}),
    fs.rm(path.join(tmpdir(), "mbler"), {
      recursive: true,
      force: true
    }).catch(() => {})
  ]);
  console.log(lang.s0);
};