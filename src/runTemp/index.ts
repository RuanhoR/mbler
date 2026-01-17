import fs from 'node:fs/promises';
import path from 'path';
import * as utils from './../utils/index.js';
import logger from './../loger/index.js';
import uuid from './../uuid/index.js';
import FileMethod from './File.js';

// 使用 require 导入 JSON 配置（兼容 CommonJS）
const {
  MAX,
  CACHE_DESC
} = require('./config.json');
// 临时存储类（单例模式）
class Temp extends FileMethod {
  static type: string = 'singleton class';

  // 当前临时目录路径
  dir: string = '';
  // 缓存描述文件路径
  cacheDesc: string = "";
  // 私有：临时目录路径
  private timdir: string;
  // 私有：当前临时实例 ID
  private tempId: string | null = null;

  constructor(tempDir: string) {
    super();
    this.timdir = tempDir;
  }

  // 私有方法：检查目录是否存在
  async #checkDir(dirPath: string): Promise<void> {
    const exists = await utils.FileExsit(dirPath);
    if (!exists) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }
  }

  // 初始化临时目录
  async init(): Promise<void> {
    await this.#checkDir(this.timdir);
    this.cacheDesc = path.join(this.timdir, CACHE_DESC);
    this.tempId = uuid.uuid(); // 生成唯一 ID，假设 uuid.uuid() 返回 string
    // 如果缓存文件不存在，则初始化
    if (!(await utils.FileExsit(this.cacheDesc))) {
      await fs.writeFile(
        this.cacheDesc,
        JSON.stringify({ LNnum: 1 }),
        'utf-8'
      );
    }

    const waitGen = this.wait(); // AsyncGenerator<boolean, any, unknown>
    let result = await waitGen.next();

    while (!result.done && result.value === false) {
      logger.i('temp', '等待中...');
      await utils.sleep(1000);
      result = await waitGen.next();
    }

    if (result.done) {
      logger.w('temp', '等待迭代器意外退出');
      throw new Error('Unexpected end of wait generator.');
    }
    const data = result.value;
    if (typeof data == "boolean") throw new TypeError("[read generator]")
    const instanceDir = path.join(this.timdir, this.tempId);
    await fs.writeFile(
      this.cacheDesc,
      JSON.stringify({ LNnum: (typeof data.LNnum == "number" ? data.LNnum : 1) + 1 }),
      'utf-8'
    );
    await fs.mkdir(instanceDir, { recursive: true });

    this.dir = instanceDir;

    // 设为不可枚举 & 不可写
    Object.defineProperty(this, 'cacheDesc', {
      enumerable: false,
      writable: false,
    });
  }

  // 等待并发数低于最大值，返回一个异步生成器
  async *wait(): AsyncGenerator<{
    LNnum: number
  } | boolean> {
    while (true) {
      const data = JSON.parse((await fs.readFile(this.cacheDesc)).toString());
      if (typeof data.LNnum !== "number") throw new Error("[temp error]: cannot load config")
      const currentLnNum = data?.LNnum ?? 1;
      if (currentLnNum <= MAX) {
        return data;
      }
      logger.i('TEMP', 'INFO: CONCURRENCY >= MAX_CONCURRENCY', {
        MAX_CONCURRENCY: MAX,
      });
      yield false;
      await utils.sleep(1000);
    }
  }

  // 清理临时目录
  async remove(): Promise<void> {
    if (this.tempId === null || this.dir === '') {
      throw new Error(
        `Please call init() first before calling remove().`
      );
    }

    try {
      await fs.rm(this.dir, { recursive: true, force: true });

      const data = JSON.parse(await fs.readFile(this.cacheDesc, "utf-8"));
      const newCount = Math.max((data?.LNnum || 1) - 1, 0);

      await fs.writeFile(
        this.cacheDesc,
        JSON.stringify({ LNnum: newCount }),
        'utf-8'
      );
    } catch (err) {
      logger.e('TEMP', 'Error during temp dir removal:', err);
    } finally {
      // 重置状态
      this.dir = '';
      this.tempId = null;
    }
  }
}

// 导出默认类
export default Temp;
