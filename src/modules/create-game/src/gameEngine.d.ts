import { GameContext } from "./gameContext.js";
import { GamePlayer } from "./gamePlayer/gamePlayer.js";
import { GamePlayerManager } from "./gamePlayer/playerManager.js";
import { ExtractConfig, GameState, gameStateConstructor } from "./gameState/gameState.js";
import { classConstructor } from "./utils/interfaces.js";
import { Logger } from "./utils/logger.js";
export declare abstract class GameEngine<P extends GamePlayer = any, C extends GameContext = any, O = unknown> {
    private readonly stateStack;
    protected readonly logger: Logger;
    readonly context: C;
    readonly playerManager: GamePlayerManager<P>;
    readonly key: string;
    private _isActive;
    /**是否是常驻游戏（常驻游戏不会被game end结束) */
    get isDaemon(): boolean;
    get isActive(): boolean;
    /**玩家组构建器 */
    get groupBuilder(): import("./gamePlayer/index.js").PlayerGroupBuilder<P>;
    constructor(playerClass: classConstructor<P>, key: string, config?: O);
    protected abstract buildContext(config: O): C;
    /**游戏开始 */
    protected abstract onStart(): void;
    /**游戏结束(dispose前调用) */
    protected abstract onStop(): void;
    /** 在栈顶添加一个新的子状态 */
    pushState<S extends gameStateConstructor<P, C, any>>(stateType: S, config?: ExtractConfig<S>): this;
    /** 移除栈顶的状态，返回到父状态 */
    popState(): void;
    /** 清空所有状态，并设置一个新的根状态 */
    resetState<S extends gameStateConstructor<P, C, any>>(stateType: S, config?: ExtractConfig<S>): void;
    /** 从指定的状态实例开始替换状态分支。*/
    replaceFrom<S extends gameStateConstructor<P, C, any>>(stateToReplace: GameState<P, C>, newStateType: S, config?: ExtractConfig<S>): void;
    private clearStateStack;
    private removeState;
    /**获取下一个state */
    getNextState(state: GameState<P, C>): GameState<P, C> | undefined;
    /**获取上一个state */
    getLastState(state: GameState<P, C>): GameState<P, C> | undefined;
    /**获取指定state */
    getState<T extends GameState<P, C, any>>(stateType: classConstructor<T>): T | undefined;
    /**删除指定state */
    deleteState(stateType: gameStateConstructor<P, C, any>): void;
    /**显示engine信息 */
    stats(detail?: boolean): string;
    stopGame(): void;
    private onDispose;
}
export interface GameEngineInternal {
    onDispose(): void;
    onStart(): void;
    onStop(): void;
}
