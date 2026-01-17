import config from './build-g-config.json';
import * as utils from './../utils/index.js';
import { mcVersionGeter } from './mcVersion.js';
import { fromString as uuidFromString } from './../uuid/index.js';
import * as path from 'path';

interface MblerConfig {
  name: string;
  description: string;
  version: string;
  mcVersion: string;
  ResDes?: {
    name?: string;
    version?: string;
  };
  subpack?: Record<string, string>;
  script?: {
    main?: string;
    lang?: string;
    UseBeta?: boolean;
    ui?: boolean;
  };
}

interface ManifestData {
  format_version: number;
  header: {
    name: string;
    description: string;
    uuid: string;
    version: number[];
    min_engine_version: number[];
  };
  modules: Array<{
    type: string;
    uuid: string;
    description?: string;
    version: number[];
    language?: string;
    entry?: string;
  }>;
  dependencies?: Array<{
    module_name: string;
    version: string;
  }>;
  subpack?: Array<{
    folder_name: string;
    name: string;
    memory_tier: number;
  }>;
  capabilities?: string[];
}

const isNonEmptyString = (str: unknown): boolean => typeof str === 'string' && str.trim().length > 0;

export class ManiFest {
  data: ManifestData;

  constructor(MblerConfig: MblerConfig, type: string) {
    this.data = {
      format_version: 2,
      header: {
        name: MblerConfig.name,
        description: MblerConfig.description,
        uuid: uuidFromString(MblerConfig.name, config[type].header),
        version: utils.ToArray(MblerConfig.version),
        min_engine_version: utils.ToArray(MblerConfig.mcVersion),
      },
      modules: [{
        type: type,
        uuid: uuidFromString(MblerConfig.name, config[type].module),
        description: `From Mbler`,
        version: utils.ToArray(MblerConfig.version),
      }]
    };
    if (type === "data" && MblerConfig.script) this.processScriptConfig(MblerConfig, this.data);
  }

  processScriptConfig(data: MblerConfig, manifest: ManifestData): void {
    const { script } = data;
    let entry = script.main;
    // 如果是mcx，直接设为index.js，因为mcxLoad类会聚集mcx文件和其他文件将其编译输出到index.js
    if (entry?.endsWith(".mcx") && script.lang === "mcx") entry = "index.js";
    if (!isNonEmptyString(entry))
      throw new Error('Script main entry is missing or invalid');
    if (!manifest.dependencies) manifest.dependencies = [];
    manifest.dependencies.push({
      module_name: '@minecraft/server',
      version: mcVersionGeter.ToServer(data.mcVersion, Boolean(script.UseBeta))
    });
    manifest.modules.push({
      type: 'script',
      language: 'javascript',
      entry: path.join("scripts", entry).replace("\\", "/ "),
      uuid: uuidFromString(data.name, config.ScriptId),
      version: utils.ToArray(data.version),
    });

    if (script.ui === true) {
      manifest.dependencies.push({
        module_name: '@minecraft/server-ui',
        version: mcVersionGeter.ToServerUi(data.mcVersion, Boolean(script.UseBeta))
      });
    };
    manifest.capabilities = ['script_eval'];
  };
}