import { system } from "@minecraft/server";
import { SAPIGameConfig } from "./config.js";
import { Constants } from "./constants.js";
import { gameEvents } from "./gameEvent/gameEvent.js";
import { regGameCommand } from "./system/gameCommand.js";
import { GameManager } from "./system/gameManager.js";
import { globalPlayerManager } from "./system/globalPlayerManager.js";
export const Game = {
    /**框架预定义事件 */
    events: new gameEvents(),
    /**游戏管理器 */
    manager: new GameManager(),
    playerManager: new globalPlayerManager(),
    constants: Constants,
    /**全局配置 */
    config: SAPIGameConfig,
};
/**使用配置初始化框架 */
export function initSAPIGame(config) {
    SAPIGameConfig.update(config);
}
//注册指令
system.beforeEvents.startup.subscribe((t) => {
    regGameCommand(t.customCommandRegistry);
});
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
