import { GameEventSubscription } from "./subscription.js";
export class EventManager {
    subscriptionMap = new Map();
    isActive = true;
    /**订阅事件 */
    subscribe(subscriber, event, ...args) {
        if (!this.isActive)
            return;
        const [callback, options] = args;
        const list = this.subscriptionMap.get(subscriber) ?? [];
        this.subscriptionMap.set(subscriber, list);
        // 订阅事件
        const result = options !== undefined
            ? event.subscribe(callback, options)
            : event.subscribe(callback);
        const subscription = typeof result === "function"
            ? new GameEventSubscription(event, callback)
            : result;
        const record = new EventSubscription(event, subscriber, subscription);
        list.push(record);
        return record;
    }
    /**取消订阅 */
    unsubscribe(subscription) {
        const subData = asInternal(subscription);
        const list = this.subscriptionMap.get(subData.subscriber);
        if (!list)
            return;
        //寻找，删除列表项
        const idx = list.indexOf(subscription);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
        //取消订阅
        subData.subscription.unsubscribe();
        //清理
        if (list.length === 0) {
            this.subscriptionMap.delete(subData.subscriber);
        }
    }
    unsubscribeByEvent(event) {
        this.subscriptionMap.forEach((list, subscriber) => {
            for (const subscription of list) {
                const sub = asInternal(subscription);
                if (sub.event === event) {
                    sub.subscription.unsubscribe();
                }
            }
            const filtered = list.filter((sub) => asInternal(sub).event !== event);
            if (filtered.length > 0) {
                this.subscriptionMap.set(subscriber, filtered);
            }
            else {
                this.subscriptionMap.delete(subscriber);
            }
        });
    }
    /**取消订阅指定object的所有事件 */
    unsubscribeBySubscriber(subscriber) {
        const list = this.subscriptionMap.get(subscriber);
        if (!list)
            return;
        for (const sub of list) {
            asInternal(sub).subscription.unsubscribe();
        }
        this.subscriptionMap.delete(subscriber);
    }
    dispose() {
        for (const list of this.subscriptionMap.values()) {
            for (const sub of list) {
                asInternal(sub).subscription.unsubscribe();
            }
        }
        this.subscriptionMap.clear();
        this.isActive = false;
    }
    debug() {
        console.log("=== EventManager Debug ===");
        console.log("Total subscribers:", this.subscriptionMap.size);
        this.subscriptionMap.forEach((list, subscriber) => {
            console.log("Subscriber:", subscriber.name);
            console.log("  Total subscriptions:", list.length);
            for (const sub of list) {
                const internal = asInternal(sub);
                console.log("   → Event:", internal.event.constructor.name);
            }
        });
        console.log("==========================");
    }
}
export class EventSubscription {
    event;
    subscriber;
    subscription;
    constructor(event, subscriber, subscription) {
        this.event = event;
        this.subscriber = subscriber;
        this.subscription = subscription;
    }
}
function asInternal(sub) {
    return sub;
}
