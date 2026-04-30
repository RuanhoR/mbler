import { PMNXProfile } from "../types";
import config from "./../config";
import { ConfigManger } from "./configManger";

export class TokenManger {
  static memoryToken: string | null = null;
  static async setToken(newToken: string) {
    const token = newToken.trim();
    this.memoryToken = token;
    const saved = await ConfigManger.setKey<string>("token", token);
    if (!saved) {
      throw new Error("Failed to store token");
    }
    this.task = this.requestAPI(token);
    await this.task;
  }
  static getToken(): Promise<string | void> { return ConfigManger.getKey<string>("token"); }
  static isLogin: boolean = false;
  static task: Promise<void>;
  static isLoading: boolean = true;
  static user: PMNXProfile | null = null;
  static async init() {
    const token = this.memoryToken || await this.getToken();
    if (token) {
      this.task = this.requestAPI(token);
      await this.task;
    } else {
      this.isLoading = false;
    }
  }
  static async waitVeirfy() {
    if (!this.task) await this.init();
    return await this.task;
  }
  static async requestAPI(tokenFromCaller?: string) {
    this.isLoading = true;
    this.isLogin = false;
    this.user = null;
    const token = tokenFromCaller || this.memoryToken || await this.getToken();
    if (!token || typeof token !== "string" || token.length < 1) {
      this.isLoading = false;
      return;
    }
    try {
      const result = await fetch(`${config.defaultPmnxBASE}/token/${token}/verify`, {
        method: "GET",
        credentials: "omit",
      });
      const body = await result.json().catch(() => ({})) as { data?: PMNXProfile; code?: number };
      if (result.ok && body.code === 200 && body.data) {
        this.isLogin = true;
        this.user = body.data;
      } else {
        this.isLogin = false;
      }
    } catch {
      this.isLogin = false;
    } finally {
      this.isLoading = false;
    }
  }
}
