import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FileExsit } from "./../utils/index";
const logFile = path.join(os.homedir(), ".cache/mbler/latest.log");

function _clean(promise: Promise<void>): () => void {
  return () => {
    Logger.run = Logger.run.filter((item: Promise<void>) => {
      return item !== promise;
    });
  };
}

function writeLog(logContent: string): void {
  async function write() {
    if (!(await FileExsit(logFile))) {
      try {
        await fs.mkdir(path.dirname(logFile)).catch(() => void 0);
        await fs.writeFile(logFile, "");
      } catch (err: any) {
        console.error("[logger] init error " + err.stack);
        process.exit(1);
      }
    }
    await fs.appendFile(logFile, "\n" + logContent);
  }
  const asy = write();
  Logger.run.push(asy.then(_clean(asy)));
}
export default class Logger {
  // 写入日志池
  public static LogFile = logFile;
  public static run: Promise<void>[] = [];
  private static _b(tag: string, msg: string, t: string): void {
    const date = new Date();
    const logContent = [
      `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
      `[${t} ${tag}]`,
      msg,
    ].join(" ");
    writeLog(logContent);
  }
  public static w(tag: string, msg: string): void {
    Logger._b(tag, msg, "WARN");
  }
  public static e(tag: string, msg: string): void {
    Logger._b(tag, msg, "ERROR");
  }
  public static i(tag: string, msg: string): void {
    Logger._b(tag, msg, "INFO");
  }
  public static d(tag: string, msg: string): void {
    Logger._b(tag, msg, "DEBUG");
  }
}
