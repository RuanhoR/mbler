const uuid = require('./../uuid')
const fs = require('fs/promises')
const utils = require('./../utils')
const path = require('path')
const git = require('./../git')
const {
  spawn
} = require('child_process');
const Temp = require('./../runTemp')
const RunInVm = require('./../runTemp/script')
const regex = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;
const npmStart = "npm:"
const securityFile = require('./../runTemp/securityFile')
let dirname;
module.exports = async function(workDir, _dirname, param = "") {
  param = param.trim()
  dirname = _dirname;
  // 如果已经初始化了
  try {
    if (await utils.isMblerProject(workDir)) throw new Error("WorkDir is init You shouldn't use 'create' command")
    // 缓存id
    const CreateId = uuid.fromString(`ul-to-${param}`);
    const cacheDir = path.join(process.cwd(), "lib/initializer-cache", CreateId);
    // 如果缓存存在
    if (await utils.FileExsit(cacheDir)) {
      await Load(cacheDir, workDir)
      // 不存在缓存
    } else {
      const dir = utils.join(dirname, param);
      // 尝试匹配为git url
      if (regex.test(param)) {
        await git.clone(param, cacheDir)
      } else if (param.startsWith(npmStart)) {
        // 如果是 npm 包，需要加上 npm: 前缀
        const packageName = param.slice(npmStart.length);
        // 开始npm安装
        await NpmInstall(packageName, cacheDir)
      } else if (await utils.FileExsit(dir)) {
        // 情况 : 输入路径
        await copy(param, cacheDir);
      } else {
        throw new Error("Package source not match");
      }
      await Load(cacheDir, workDir)
    }
  } catch (err) {
    console.error(`加载模板初始化失败 错误信息\n${err.stack}`)
  }
}
async function Load(cacheDir, workDir) {
  const main = (await utils.readFile(path.join(cacheDir, "package.json"), {
    want: "object"
  })).main;
  const MblerConfig = await utils.readFile(path.join(cacheDir, "mbler.config.json"), {
    want: "object"
  });
  const query = {
    name: MblerConfig.name,
    description: MblerConfig.description,
    version: MblerConfig.version,
    // securityFile提供不能来到上级的文件操作
    setWorkDir: new securityFile(workDir)
  };
  const Content = new RunInVm(dirname, [
    "fs",
    "child_process",
    "fs/promises",
    "http",
    "https",
    "express",
    "dayjs"
  ])
  Content.run(path.join(cacheDir, main)).main(query)
}

function runNpm(param, cwd) {
  return new Promise((resolve, reject) => {
    const processC = spawn('npm', param, {
      cwd,
      stdio: 'ignore'
    });
    processC.on('close', resolve);
    processC.on('error', (err) => {
      reject(err);
    });
  });
}
async function NpmInstall(dependencies, tagerDir) {
  const temp = new Temp(
    './lib/data/cache',
    dirname
  );
  await temp.init();
  const {
    dir
  } = temp;
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({
    name: "",
    description: "",
    version: "0.0.1",
    type: "commjs"
  }))
  const rel = await runNpm(["install", dependencies], dir);
  if (rel !== 0) throw new Error(`npm package install falled`);
  const ModDor = path.join(dir, "node_modules")
  // 复制到目标目录
  await copy(ModDir, tagerDir);
  await temp.remove();
}

function copy(source, out) {
  return new Promise((then, error) => fs.readdir(source)
    .then((data) => Promise.all(data
      .map(file => utils.copy(path.join(source, file), path.join(out, file)))
    ).then(then))
  )
}