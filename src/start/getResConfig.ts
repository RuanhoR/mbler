import path from 'path';
import * as utils from './../utils/index.js';

const cache = new Map<string, unknown>();

export = async function getResConfig(dirname: string): Promise<Map<string, unknown>> {
  cache.set('Mod', await utils.readFile(
    path.join(dirname, './lib/modules/contents.json'), {
      want: 'object'
    }
  ));
  cache.set('innerDef', await utils.readFile(
    path.join(dirname, './lib/modules/innerDef.json'), {
      want: 'object'
    }
  ));
  return cache;
};