import { EventSubscription } from "../gameEvent/eventManager.js";
import { EventSignal } from "../gameEvent/eventSignal.js";
import { GameState } from "../gameState/gameState.js";
type InferContext<S> = S extends GameState<any, infer C, any> ? C : never;
export declare abstract class GameComponent<S extends GameState<any, any>, O = unknown> {
    protected options?: O | undefined;
    private _isAttached;
    /**是否已经attach */
    get isAttached(): Readonly<boolean>;
    protected readonly state: S;
    /**tag */
    readonly tag?: string;
    protected get context(): InferContext<S>;
    protected get runner(): import("../main.js").RunnerManager;
    constructor(state: S, options?: O | undefined, tag?: string);
    private _onAttach;
    protected abstract onAttach(): void;
    private _onDetach;
    /**随便重写 */
    protected onDetach(): void;
    /**订阅事件 */
    protected subscribe<T extends EventSignal<any>>(event: T, ...args: Parameters<T["subscribe"]>): EventSubscription | undefined;
    /**取消订阅 */
    protected unsubscribe(sub: EventSubscription): void;
}
export type GameComponentType<S extends GameState<any, any>, O = any> = new (state: S, options?: O, tag?: string) => GameComponent<S, O>;
export {};
