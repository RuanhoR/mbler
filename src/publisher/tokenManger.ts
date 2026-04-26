import { PMNXProfile } from "../types";
import config from "./../config";
import { ConfigManger } from "./configManger";

export class TokenManger {
  static setToken(newToken: string) {
    ConfigManger.setKey<string>("token", newToken);
    this.task = this.requestAPI();
  }
  static getToken(): Promise<string | void> { return ConfigManger.getKey<string>("token"); }
  static isLogin: boolean = false;
  static task: Promise<void>;
  static isLoading: boolean = true;
  static user: PMNXProfile | null = null;
  static async init() {
    const token = await this.getToken();
    if (token) {
      this.task = this.requestAPI();
      await this.task;
    } else {
      this.isLoading = false;
    }
  }
  static async waitVeirfy() {
    if (!this.task) await this.init();
    console.debug(this.task)
    return await this.task;
  }
  static async requestAPI() {
    this.isLoading = true;
    this.isLogin = false;
    const token = await this.getToken();
    const result = await fetch(`${config.defaultPmnxBASE}/token/${token}/verify`, {
      method: "GET",
      credentials: "omit",
    });
    this.isLoading = false;
    const body = await result.json()
    if (result.ok) {
      this.isLogin = true;
      this.user = (body as { data: PMNXProfile, code: number }).data;
    } else {
      this.isLogin = false;
    }
  }
}