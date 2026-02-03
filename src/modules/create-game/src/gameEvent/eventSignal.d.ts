import { Subscription } from "./subscription.js";
import { Logger } from "../utils/logger.js";
/**事件回调 */
export type EventCallBack<T = void> = T extends void ? () => void : (arg0: T) => void;
export type EventSignal<T> = VanillaEventSignal<T> | CustomEventSignal<T>;
/**游戏原生事件 */
export interface VanillaEventSignal<T> {
    subscribe(callback: EventCallBack<T>, options?: unknown): EventCallBack<T>;
    unsubscribe(callback: EventCallBack<T>): void;
}
export interface CustomEventSignal<T> {
    subscribe(callback: EventCallBack<T>, options?: unknown): Subscription;
}
/**自定义事件 */
export declare abstract class BasicCustomEventSignal<T, U> {
    protected set: Set<T>;
    protected logger: Logger;
    protected unsubscribe(item: T): void;
    protected abstract runCallback(item: T, data: U): void;
    publish(data: U): void;
}
