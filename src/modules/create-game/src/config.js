import { logLevel } from "./utils/index.js";
const defaultConfig = {
    logLevel: logLevel.debug,
    onEnd: () => { },
    onJoin: () => { },
    hub: () => { },
    debugMode: false,
};
export class SAPIGameConfig {
    static _config = {};
    /** 获取当前配置（合并默认配置和用户配置） */
    static get config() {
        return { ...defaultConfig, ...this._config };
    }
    /** 更新配置（部分更新即可） */
    static update(config) {
        this._config = { ...this._config, ...config };
    }
    /** 重置为默认配置 */
    static reset() {
        this._config = {};
    }
}
