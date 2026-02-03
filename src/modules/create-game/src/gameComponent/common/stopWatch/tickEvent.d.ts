import { CustomEventSignal } from "../../../gameEvent/eventSignal.js";
import { Subscription } from "../../../gameEvent/subscription.js";
export interface StopWatchTickEvent {
    elapsedTime: number;
}
export declare class StopWatchTickEventSignal implements CustomEventSignal<StopWatchTickEvent> {
    private tickCallbacks;
    private logger;
    constructor();
    /** 注册一个在每次时间增加（每秒）时执行的回调函数*/
    subscribe(callback: (arg0: StopWatchTickEvent) => void): Subscription;
    publish(elapsedTime: number): void;
}
