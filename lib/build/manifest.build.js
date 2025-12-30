const config = require('./build-g-config.json');
const utils = require('./../utils');
const {
  mcVersionGeter
} = require('./mcVersion.js');
const {
  fromString: uuidFromString
} = require('./../uuid');
const path = require("path")
const isNonEmptyString = str => typeof str === 'string' && str.trim().length > 0;
module.exports = class ManiFest {
  constructor(MblerConfig, type) {
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
    if (type === "data" && MblerConfig.script) this.processScriptConfig(MblerConfig, this.data)
  }
  processScriptConfig(data, manifest) {
    const {
      script
    } = data;
    let entry = script.main;
    // 如果是mcx，直接设为index.js，因为mcxLoad类会聚集mcx文件和其他文件将其编译输出到index.js
    if (entry.endsWith(".mcx") && script.lang === "mcx") entry = "index.js";
    if (!isNonEmptyString(entry))
      throw new Error(tip.build.script_main_entry_missing);
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