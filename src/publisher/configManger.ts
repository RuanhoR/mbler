import path from "node:path";
import { fileExists, writeJSON, readFileAsJson as readJSON } from "../utils";
import config from "../config";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import Logger from "../logger";
export class ConfigManger {
  static defaultConfigPoint = path.join(homedir(), ".config", "_config.json")
  static cacheValue: Record<string, unknown> = {}
  private static lockPromise: Promise<void> | null = null;
  private static lockResolver: (() => void) | null = null;
  private static cacheTTL = 5000; // 5秒缓存
  private static lastAccess = 0;
  private static currentConfigPath = '';
  private static async acquireLock(): Promise<void> {
    while (this.lockPromise) {
      await this.lockPromise;
    }
    this.lockPromise = new Promise((resolve) => {
      this.lockResolver = resolve;
    });
  }
  private static releaseLock(): void {
    if (this.lockResolver) {
      this.lockResolver();
      this.lockPromise = null;
      this.lockResolver = null;
    }
  }
  private static isCacheValid(configPath: string): boolean {
    return this.currentConfigPath === configPath &&
      Date.now() - this.lastAccess < this.cacheTTL &&
      Object.keys(this.cacheValue).length > 0;
  }
  private static async loadConfigToCache(configPath: string): Promise<void> {
    try {
      await this.acquireLock();
      if (this.isCacheValid(configPath)) {
        this.releaseLock();
        return;
      }
      const configData = await readJSON(configPath);
      this.cacheValue = configData as typeof this.cacheValue;
      this.currentConfigPath = configPath;
      this.lastAccess = Date.now();

      this.releaseLock();
    } catch (error) {
      this.releaseLock();
      this.cacheValue = {};
      throw error;
    }
  }

  private static async saveCacheToFile(configPath: string): Promise<void> {
    try {
      await this.acquireLock();
      await writeJSON(configPath, this.cacheValue);
      this.lastAccess = Date.now();
      this.releaseLock();
    } catch (error) {
      this.releaseLock();
      throw error;
    }
  }
  static async getConfigPoint(): Promise<string> {
    try {
      const file = await readFile(path.join(config.tmpdir, "_config_point.json"));
      const configPoint = JSON.parse(file.toString());
      return configPoint.point;
    } catch {
      if (!await fileExists(this.defaultConfigPoint)) {
        await writeJSON(this.defaultConfigPoint, {
        })
      }
      await writeJSON(path.join(config.tmpdir, "_config_point.json"), {
        point: this.defaultConfigPoint,
        update: new Date()
      });
      return this.defaultConfigPoint;
    }
  }
  static async setConfigPoint(point: string) {
    if (!await fileExists(point)) {
      throw new Error("[mbler config]: can't bind config file: " + point)
    }
    await writeJSON(path.join(config.tmpdir, "_config_point.json"), {
      point,
      update: new Date()
    });
  }
  static async getKey<T>(key: string): Promise<T | undefined> {
    try {
      const configPath = await this.getConfigPoint();

      // 使用缓存，避免频繁文件读取
      if (!this.isCacheValid(configPath)) {
        await this.loadConfigToCache(configPath);
      }

      return this.cacheValue[key] as T;
    } catch (error) {
      return undefined;
    }
  }

  static async setKey<T>(key: string, value: T): Promise<boolean> {
    try {
      const configPath = await this.getConfigPoint();

      // 确保缓存是最新的
      if (!this.isCacheValid(configPath)) {
        await this.loadConfigToCache(configPath);
      }
      this.cacheValue[key] = value;
      this.saveCacheToFile(configPath).catch(error => {
        Logger.e('ConfigManger', 'Failed to save config to file:' + error);
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  static async init(defaultConfig: Record<string, any> = {}) {
    const configPath = await this.getConfigPoint();
    if (!await fileExists(configPath)) {
      await writeJSON(configPath, defaultConfig);
    }
  }
}