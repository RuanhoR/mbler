import {
  red,
  yellow,
  white,
  cyan,
  reset
} from './colors.js';
import util from 'util';
import * as utils from './../utils/index.js';
/**
 * 日志级别
 * @readonly
 * @enum {string}
 */
const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};
/**
 * 日志颜色
 * @readonly
 * @type {Object<string, string>}
 */
const LEVEL_COLORS: any = {
  [LEVELS.ERROR]: red,
  [LEVELS.WARN]: yellow,
  [LEVELS.INFO]: white,
  [LEVELS.DEBUG]: cyan
};

class Logger {
  [util.inspect.custom] = this.toString;
  /**
   * 打印日志
   * @private
   * @param {string} tag - 日志标签
   * @param {string} level - 日志级别
   * @param {string} color - 颜色前缀
   * @param {Array<*>} msgs - 日志内容
   */
  #print(tag: string, level: string, color: string, msgs: any[]): void {
    const time = new Date().toISOString();
    const msgStr = utils.toString(msgs)
    this.getConsole(level.toLowerCase(), `${color}[${level}] [${tag}] ${time}: ${msgStr} ${reset}`);
  }
  getConsole(type: string, t: string): void {
    switch (type) {
      case "error":
        console.error(t)
        break;
      case "info":
        console.info(t)
        break;
      case "warn":
        console.warn(t)
        break;
      case "debug":
        console.debug(t)
        break;
      default:
        console.info(t)
    }
  }
  /**
   * 错误日志
   * @param {string} tag - 日志标签
   * @param {...*} msgs - 日志内容
   */
  public e(tag: string, ...msgs: any[]): void {
    this.#print(tag, LEVELS.ERROR, LEVEL_COLORS[LEVELS.ERROR], msgs);
  }
  /**
   * 警告日志
   * @param {string} tag - 日志标签
   * @param {...*} msgs - 日志内容
   */
  public w(tag: string, ...msgs: any[]): void {
    this.#print(tag, LEVELS.WARN, LEVEL_COLORS[LEVELS.WARN], msgs);
  }

  /**
   * 信息日志
   * @param {string} tag - 日志标签
   * @param {...*} msgs - 日志内容
   */
  public i(tag: string, ...msgs: any[]): void {
    this.#print(tag, LEVELS.INFO, LEVEL_COLORS[LEVELS.INFO], msgs);
  }

  /**
   * 调试日志
   * @param {string} tag - 日志标签
   * @param {...*} msgs - 日志内容
   */
  d(tag: string, ...msgs: any[]): void {
    this.#print(tag, LEVELS.DEBUG, LEVEL_COLORS[LEVELS.DEBUG], msgs);
  }
  /**
   * @returns {string}
   */
  toString(): string {
    return '[object Logger]';
  }
}
export default new Logger()