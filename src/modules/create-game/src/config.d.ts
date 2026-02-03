import { Player } from "@minecraft/server";
import { logLevel } from "./utils/index.js";
export interface SAPIGameConfigOptions {
    logLevel?: logLevel;
    /**game end指令调用 */
    onEnd?: () => void;
    onJoin?: (player: Player) => void;
    hub?: (player: Player) => void;
    debugMode?: boolean;
}
export declare class SAPIGameConfig {
    private static _config;
    /** 获取当前配置（合并默认配置和用户配置） */
    static get config(): Readonly<Required<SAPIGameConfigOptions>>;
    /** 更新配置（部分更新即可） */
    static update(config: SAPIGameConfigOptions): void;
    /** 重置为默认配置 */
    static reset(): void;
}
