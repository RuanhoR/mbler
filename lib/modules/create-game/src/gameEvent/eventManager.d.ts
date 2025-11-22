import { EventSignal } from "./eventSignal.js";
import { Subscription } from "./subscription.js";
export declare class EventManager {
    private readonly subscriptionMap;
    private isActive;
    /**订阅事件 */
    subscribe<T extends EventSignal<any>>(subscriber: object, event: T, ...args: Parameters<T["subscribe"]>): EventSubscription | undefined;
    /**取消订阅 */
    unsubscribe(subscription: EventSubscription): void;
    unsubscribeByEvent(event: EventSignal<any>): void;
    /**取消订阅指定object的所有事件 */
    unsubscribeBySubscriber(subscriber: object): void;
    dispose(): void;
    debug(): void;
}
export declare class EventSubscription {
    private readonly event;
    private readonly subscriber;
    private readonly subscription;
    constructor(event: EventSignal<any>, subscriber: object, subscription: Subscription);
}
