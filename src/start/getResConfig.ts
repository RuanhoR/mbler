import path from 'path';
import * as utils from './../utils/index.js';

const cache = new Map<string, unknown>();

export = async function getResConfig(dirname: string): Promise<Map<string, unknown>> {
  cache.set('Mod', JSON.parse(await utils.readFile(path.join(dirname, './lib/modules/contents.json'), "utf-8")));
  cache.set('innerDef', JSON.parse(await utils.readFile(path.join(dirname, './lib/modules/innerDef.json'), "utf-8")));
  return cache;
};