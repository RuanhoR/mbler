import path from 'path';
import fs from "node:fs/promises"
const cache = new Map<string, unknown>();

export = async function getResConfig(dirname: string): Promise<Map<string, any>> {
  cache.set('Mod', JSON.parse(await fs.readFile(path.join(dirname, './lib/modules/contents.json'), "utf-8")));
  cache.set('innerDef', JSON.parse(await fs.readFile(path.join(dirname, './lib/modules/innerDef.json'), "utf-8")));
  return cache;
};
