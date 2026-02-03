import { EventCallBack, VanillaEventSignal } from "./eventSignal.js";
export interface Subscription {
    unsubscribe(): void;
}
/**游戏订阅句柄*/
export declare class GameEventSubscription<T> implements Subscription {
    event: VanillaEventSignal<T>;
    callback: EventCallBack<T>;
    constructor(event: VanillaEventSignal<T>, callback: EventCallBack<T>);
    /**取消订阅事件 */
    unsubscribe(): void;
}
