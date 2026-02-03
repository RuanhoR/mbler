import { GameComponentType } from "../gameComponent/gameComponent.js";
import { GameContext } from "../gameContext.js";
import { GameEngine } from "../gameEngine.js";
import { EventManager } from "../gameEvent/eventManager.js";
import { EventSignal } from "../gameEvent/eventSignal.js";
import { GamePlayer } from "../gamePlayer/gamePlayer.js";
import { GamePlayerManager } from "../gamePlayer/playerManager.js";
import { RunnerManager } from "../Runner/RunnerManager.js";
import { Logger } from "../utils/logger.js";
export type ExtractConfig<S> = S extends gameStateConstructor<any, any, infer T> ? T : never;
export type gameStateConstructor<P extends GamePlayer = any, C extends GameContext = any, TConfig = unknown> = new (engine: GameEngine<P, C, any>, config?: TConfig) => GameState<P, C, TConfig>;
/**游戏状态 */
export declare abstract class GameState<P extends GamePlayer = any, C extends GameContext = any, TConfig = unknown, E extends GameEngine<P, C> = GameEngine<P, C>> {
    protected readonly logger: Logger;
    protected readonly engine: E;
    private readonly components;
    readonly eventManager: EventManager;
    readonly runner: RunnerManager;
    readonly config?: TConfig;
    constructor(engine: E, config?: TConfig);
    /**全局上下文 */
    get context(): C;
    /**玩家管理器 */
    get playerManager(): GamePlayerManager<P>;
    get gameKey(): string;
    /**获取子状态 */
    get nextState(): GameState<P, C, unknown, GameEngine<P, C, unknown>> | undefined;
    get lastState(): GameState<P, C, unknown, GameEngine<P, C, unknown>> | undefined;
    /**进入 */
    protected abstract onEnter(): void;
    /**
     * 添加组件到当前状态
     * @param component 组件类型
     * @param options 组件参数
     * @param tag 组件标签(唯一)
     * @throws {GameComponentAlreadyExistsError} 组件已存在时抛出
     * @throws {ComponentLoadFailedError} 组件加载失败时抛出
     */
    addComponent<C extends GameComponentType<any, any>>(component: C, options?: ConstructorParameters<C>[1], tag?: string): this;
    /**添加多个components(不能带参数和tag) */
    addComponents(components: GameComponentType<any>[]): void;
    /**
     * 获取当前状态中的组件
     * @param type 组件类型
     * @param tag 组件标签
     * @throws {GameComponentNotExistsError} 若组件不存在，则抛出
     */
    getComponent<C extends GameComponentType<any, any>>(type: C, tag?: string): InstanceType<C>;
    /**删除当前状态中的组件
     * @throws {ComponentDeleteFailedError} 组件删除失败时
     */
    deleteComponent(component: GameComponentType<any>, tag?: string): this;
    /**删除所有组件
     * @throws {ComponentDeleteFailedError} 删除失败时
     */
    private deleteAllComponents;
    protected subscribe<T extends EventSignal<any>>(event: T, ...args: Parameters<T["subscribe"]>): import("../gameEvent/index.js").EventSubscription | undefined;
    /** 进入一个新的子状态 */
    protected pushState<S extends gameStateConstructor<P, C, any>>(stateType: S, config?: ExtractConfig<S>): void;
    /** 返回到父状态 */
    protected popState(): void;
    /**将当前状态及其所有子状态，替换为一个新状态。*/
    protected transitionTo<T>(stateType: gameStateConstructor<P, C, T>, config?: T): void;
    private _onExit;
    protected onExit(): void;
    /**返回基本信息 */
    stats(): string;
}
