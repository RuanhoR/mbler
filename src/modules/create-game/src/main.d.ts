import { SAPIGameConfig, SAPIGameConfigOptions } from "./config.js";
import { gameEvents } from "./gameEvent/gameEvent.js";
import { GameManager } from "./system/gameManager.js";
import { globalPlayerManager } from "./system/globalPlayerManager.js";
export declare const Game: {
    /**框架预定义事件 */
    readonly events: gameEvents;
    /**游戏管理器 */
    readonly manager: GameManager;
    readonly playerManager: globalPlayerManager;
    readonly constants: {
        readonly dimension: {
            readonly Overworld: import("@minecraft/server").Dimension;
            readonly Nether: import("@minecraft/server").Dimension;
            readonly End: import("@minecraft/server").Dimension;
        };
    };
    /**全局配置 */
    readonly config: typeof SAPIGameConfig;
};
/**使用配置初始化框架 */
export declare function initSAPIGame(config: SAPIGameConfigOptions): void;
export * from "./gameRegion/index.js";
export * as Utils from "./utils/index.js";
export * from "./gameComponent/index.js";
export * from "./gameState/index.js";
export * from "./gamePlayer/index.js";
export { GameEngine } from "./gameEngine.js";
export { GameContext } from "./gameContext.js";
export { GameStructure } from "./gameStructure/gameStructure.js";
export { ScriptRunner, ScriptCancelledError } from "./Runner/scriptRunner.js";
export { RunnerManager } from "./Runner/RunnerManager.js";
export * from "./gameEvent/index.js";
export * from "./system/gameManager.js";
export * from "./system/globalPlayerManager.js";
export { createGameModule } from "./createGameModule.js";
