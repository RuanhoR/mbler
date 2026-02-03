import { CustomEventSignal } from "../../../gameEvent/eventSignal.js";
import { Subscription } from "../../../gameEvent/subscription.js";
export interface TimerTickEvent {
    remainingTime: number;
}
export declare class TimerTickEventSignal implements CustomEventSignal<TimerTickEvent> {
    private tickCallbacks;
    private logger;
    constructor();
    /** 注册一个在每次时间减少（每秒）时执行的回调函数*/
    subscribe(callback: (arg0: TimerTickEvent) => void): Subscription;
    publish(remainingTime: number): void;
}
