import i18n from "../i18n";
import { input } from "../utils";
import { ConfigManger } from "./configManger";

export class GamePath {
  static async askPath(autoset: boolean = true): Promise<string> {
    const result = await input(i18n.publish.askTip);
    if (!result) {
      throw new Error("No path provided");
    }
    if (autoset) {
      ConfigManger.setKey("gamePath", result);
    }
    return result;
  }
  static async getPath(): Promise<string | null> {
    const path = await ConfigManger.getKey<string>("gamePath");
    return path || null;
  }
  static async clearPath() {
    await ConfigManger.setKey("gamePath", "");
  }
  static async getPathWithASK(): Promise<string> {
    let path = await this.getPath();
    if (!path) {
      path = await this.askPath();
    }
    return path;
  }
}