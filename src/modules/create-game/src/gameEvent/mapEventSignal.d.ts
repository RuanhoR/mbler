import { Logger } from "../utils/index.js";
import { CustomEventSignal } from "./eventSignal.js";
import { Subscription } from "./subscription.js";
/** 通用的订阅数据 */
export interface SubscriptionData<TEvent> {
    callback: (event: TEvent) => void;
}
/** 通用事件信号基类 */
export declare abstract class BaseMapEventSignal<TKey, TEvent, TData extends SubscriptionData<TCustomEvent>, TOptions, TCustomEvent = TEvent> implements CustomEventSignal<TCustomEvent> {
    protected logger: Logger;
    protected map: Map<TKey, Set<TData>>;
    protected totalCount: number;
    private inited;
    private nativeUnsub?;
    subscribe(callback: (event: TCustomEvent) => void, options: TOptions): Subscription;
    private wrapUnsub;
    protected init(): void;
    cleanup(): void;
    private publish;
    /** 子类实现：如何从订阅 options 构造 key */
    protected abstract buildKey(options: TOptions): TKey | null;
    /** 子类实现：如何从订阅 options 构造 data */
    protected abstract buildData(callback: (event: TCustomEvent) => void, options: TOptions): TData;
    /** 子类实现：如何从原生事件提取 key */
    protected abstract extractKey(event: TEvent): TKey | null;
    /** 子类可重写：是否为需要的事件 */
    protected isTargetEvent(event: TEvent): boolean;
    /**自定义事件返回 */
    protected eventWrapper(event: TEvent): TCustomEvent;
    /** 子类实现：是否触发回调 */
    protected abstract filter(data: TData, event: TEvent): boolean;
    /** 子类实现：订阅原生事件 */
    protected abstract subscribeNative(cb: (event: TEvent) => void): (event: TEvent) => void;
    /** 子类实现：取消原生事件 */
    protected abstract unsubscribeNative(cb: (event: TEvent) => void): void;
}
