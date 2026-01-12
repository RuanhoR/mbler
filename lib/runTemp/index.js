const fs = require('fs/promises');
const path = require('path');
const utils = require('./../utils');
const logger = require('./../loger');
const uuid = require('./../uuid');
const FileMethod = require('./File.js')
const {
  MAX,
  CACHE_DESC
} = require('./config.json')
let tempId = null;
// 用于临时数据存储
class Temp extends FileMethod {
  static type = 'singleton class'
  // 外部接口，可以用fs的方法设置这个目录
  dir = null;
  cacheDesc = null;
  #timdir = null;
  constructor(tempDir) {
    super();
    this.#timdir = utils.join(tempDir);
  }
  // 私有方法：检查目录是否存在
  async #checkDir(dirPath) {
    const exists = await utils.FileExsit(dirPath);
    if (!exists) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }
  }

  // 初始化临时目录
  async init() {
    await this.#checkDir(this.#timdir);
    // 单例检查
    if (tempId !== null) {
      throw new Error(
        `Temp is a ${Temp.type}. Please do not initialize multiple instances.`
      );
    }

    this.cacheDesc = path.join(this.#timdir, CACHE_DESC);
    tempId = uuid.uuid(); // 生成唯一 ID

    // 如果缓存文件不存在，则初始化
    if (!await utils.FileExsit(this.cacheDesc)) {
      await fs.writeFile(this.cacheDesc, JSON.stringify({
        LNnum: 1
      }), 'utf-8');
    }
    const waitGen = this.wait(); // 得到一个 AsyncGenerator
    let result = await waitGen.next()
    while (result === false) {
      logger.i('temp', '等待中...');
      if (result.done) {
        logger.w('temp', '等待迭代器意外退出')
      }
      await utils.sleep(1000);
      result = await waitGen.next()
    }
    const data = result.value;
    const instanceDir = path.join(this.#timdir, tempId);
    await fs.writeFile(
      this.cacheDesc,
      JSON.stringify({
        LNnum: data.LNnum + 1
      }),
      'utf-8'
    );
    await fs.mkdir(instanceDir, {
      recursive: true
    }); // 确保可递归创建

    this.dir = instanceDir;
    Object.defineProperty(this, 'cacheDesc', {
      enumerable: false,
      writable: false
    });
  }
  // 等待并发数低于最大值
  async * wait() {
    while (true) {
      const data = await utils.readFile(this.cacheDesc, {
        want: 'object'
      });
      if (data?.LNnum <= MAX) return data;
      logger.i(
        'TEMP',
        'INFO: CONCURRENCY >= MAX_CONCURRENCY', {
          MAX_CONCURRENCY: MAX
        }
      );
      yield false
    }
  }
  // 清理临时目录
  async remove() {
    if (tempId === null || this.dir === null) {
      throw new Error(`Please call init() first before calling remove().`);
    }
    try {
      await fs.rm(this.dir, {
        recursive: true,
        force: true
      });
      const data = await utils.readFile(this.cacheDesc, {
        want: 'object'
      });
      const newCount = Math.max((data?.LNnum || 1) - 1, 0);
      await fs.writeFile(
        this.cacheDesc,
        JSON.stringify({
          LNnum: newCount
        }),
        'utf-8'
      );
    } catch (err) {
      logger.e('TEMP', 'Error during temp dir removal:', err);
    } finally {
      // 重置状态，让可以继续调用
      this.dir = null;
      tempId = null;
    }
  }

}

module.exports = Temp;