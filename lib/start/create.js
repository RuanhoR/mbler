const uuid = require('./../uuid')
const fs = require('fs/promises')
const utils = require('./../utils')
const path = require('path')
const git = require('./../git')
const regex = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;
const npmStart = "npm:"
module.exports = async (workDir, dirname, param) => {
  function Load(cacheDir) {
        const main = (await utils.readFile(path.join(cacheDir, "package.json"), {
        want: "object"
      })).main;
      const MblerConfig = await utils.readFile(path.join(cacheDir, "mbler.config.json"), {
        want: "object"
      });
      const query = {
        name: MblerConfig.name,
        description: MblerConfig.description,
        work: workDir
      };
      require(path.join(cacheDir, main)).main(query)
  }


  // 如果已经初始化了
  try {
    if (await utils.isMblerProject(workDir)) throw new Error("WorkDir is init You shouldn't use 'create' command")
    // 缓存id
    const CreateId = uuid.fromString(`ul-to-${param}`);
    const cacheDir = path.join(dirname, "lib/initializer-cache", CreateId);
    // 如果缓存存在
    if (await utilsxFileExsit(cacheDir)) {
      Load(cacheDir)
    // 不存在缓存
    } else {
      // 尝试匹配为git url
      if (regex.test(param)) {
        git.clone(param, cacheDir)
      } else if (param.startsWith(npmStart)) {
        // 如果是 npm 包，需要加上 npm: 前缀
        const packageName = param.slice(npmStart.length);
        
      }
    }
  } catch (err) {
    console.error(`加载模板初始化失败 错误信息 ${err.stack}`)
  }
}