import logger from './../loger/index.js';
import path from 'path';
import * as fs from 'fs/promises';

let dirname: string = '';
let cache: Map<string, unknown> | null = null;

export = async function Uninstall(
  packName: string,
  dirname_: string
): Promise<void> {
  dirname = dirname_;

  try {
    const cache = await (require('./getResConfig.js'))() as Map<unknown, unknown>;
    const mods = cache.get('Mod') as Array<{ name: string; git: string }>;
    let find = false;
    for (let [index, item] of mods.entries()) {
      if (item.name !== packName || item.git === 'inner') continue;
      mods.splice(index, 1);
      find = true;
      // 删除依赖
      await fs.rm(
        path.join(
          dirname, 'lib/modules', item.name
        ), {
          recursive: true,
          force: true
        }
      );
      break;
    }
    if (!find) throw new Error('未安装此包');
  } catch (err) {
    logger.e('uninstall', (err as Error).message);
  }
};