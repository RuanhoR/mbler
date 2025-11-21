import { GamePlayerManager } from "./gamePlayer/playerManager";
import { Game } from "./main";
import { GameEngineError } from "./utils/GameError";
import { Logger } from "./utils/logger";
export class GameEngine {
    stateStack = [];
    logger;
    context;
    playerManager;
    key;
    _isActive = false;
    /**是否是常驻游戏（常驻游戏不会被game end结束) */
    get isDaemon() {
        return false;
    }
    get isActive() {
        return this._isActive;
    }
    /**玩家组构建器 */
    get groupBuilder() {
        return this.playerManager.groupBuilder;
    }
    constructor(playerClass, key, config) {
        this.playerManager = new GamePlayerManager(playerClass, key, this.isDaemon);
        this.key = key;
        this.context = this.buildContext(config ?? {});
        this.logger = new Logger(this.constructor.name);
        this._isActive = true;
    }
    /** 在栈顶添加一个新的子状态 */
    pushState(stateType, config) {
        if (!this.isActive)
            return this;
        this.logger.debug(`Pushing state: ${stateType.name}`);
        const stateInstance = new stateType(this, config);
        this.stateStack.push(stateInstance);
        stateInstance.onEnter();
        return this;
    }
    /** 移除栈顶的状态，返回到父状态 */
    popState() {
        const topState = this.stateStack.pop();
        if (topState) {
            this.removeState(topState);
        }
    }
    /** 清空所有状态，并设置一个新的根状态 */
    resetState(stateType, config) {
        this.logger.debug(`Setting root state to: ${stateType.name}`);
        this.clearStateStack();
        this.pushState(stateType, config);
    }
    /** 从指定的状态实例开始替换状态分支。*/
    replaceFrom(stateToReplace, newStateType, config) {
        this.logger.debug(`Replacing from ${stateToReplace.constructor.name} with ${newStateType.name}`);
        const index = this.stateStack.indexOf(stateToReplace);
        if (index === -1) {
            this.logger.error(`无法找到要替换的状态实例:${stateToReplace.constructor.name}`);
            throw new GameEngineError("State to replace not found in stack.");
        }
        // 清理后续所有状态
        while (this.stateStack.length > index) {
            const removed = this.stateStack.pop();
            this.removeState(removed);
        }
        this.pushState(newStateType, config);
    }
    clearStateStack() {
        while (this.stateStack.length > 0) {
            this.popState();
        }
    }
    removeState(state) {
        this.logger.debug(`Removing state: ${state.constructor.name}`);
        state._onExit();
    }
    /**获取下一个state */
    getNextState(state) {
        const index = this.stateStack.findIndex((s) => s === state);
        if (index != -1 && this.stateStack.length > index + 1) {
            return this.stateStack[index + 1];
        }
    }
    /**获取上一个state */
    getLastState(state) {
        const index = this.stateStack.findIndex((s) => s === state);
        if (index > 0) {
            return this.stateStack[index - 1];
        }
    }
    /**获取指定state */
    getState(stateType) {
        const state = this.stateStack.find((s) => s.constructor == stateType);
        if (state) {
            return state;
        }
    }
    /**删除指定state */
    deleteState(stateType) {
        const idx = this.stateStack.findIndex((s) => s.constructor == stateType);
        if (idx != -1) {
            const [removed] = this.stateStack.splice(idx, 1);
            this.removeState(removed);
        }
    }
    /**显示engine信息 */
    stats(detail = false) {
        let stateLine;
        const stateNames = this.stateStack.map((s) => s.constructor.name);
        const playersLine = `§ePlayers§r: §a${this.playerManager.validSize}§r / §7${this.playerManager.size}`;
        if (detail) {
            const stateStats = this.stateStack.map((s) => s.stats());
            stateLine =
                stateNames.length > 0
                    ? `§eStates§r(${stateNames.length}): \n    ${stateStats.join("\n    ")}`
                    : `§eStates§r: §7<empty>`;
        }
        else {
            stateLine =
                stateNames.length > 0
                    ? `§eStates§r(${stateNames.length}): §b${stateNames.join(" §7| §b")}`
                    : `§eStates§r: §7<empty>`;
        }
        return ["", playersLine, stateLine].join("\n  ");
    }
    stopGame() {
        Game.manager.stopGameByKey(this.key);
    }
    onDispose() {
        this.logger?.debug("dispose");
        this.playerManager.dispose();
        this._isActive = false;
        this.clearStateStack();
    }
}
