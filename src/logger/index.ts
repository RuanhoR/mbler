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
    try {
      const dir = path.dirname(logFile);
      if (!(await FileExsit(dir))) {
        // ensure the directory exists, root-to-leaf
        await fs.mkdir(dir, { recursive: true }).catch(() => void 0);
      }
      // if file does not exist, create it (touch)
      if (!(await FileExsit(logFile))) {
        await fs.writeFile(logFile, "");
      }
    } catch (err: any) {
      // if we can't prepare the log file, output to stderr but don't crash
      console.error("[logger] unable to prepare log file:", err);
      return;
    }

    try {
      await fs.appendFile(logFile, "\n" + logContent);
    } catch (err: any) {
      console.error("[logger] failed to append to log file:", err);
    }
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
