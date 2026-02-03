import { Duration } from "../../utils/duration.js";
import { CustomEventSignal } from "../eventSignal.js";
import { Subscription } from "../subscription.js";
/** 间隔时间事件 */
export declare class IntervalEventSignal implements CustomEventSignal<void> {
    private intervalId;
    private items;
    private logger;
    subscribe(callback: () => void, interval?: Duration): Subscription;
    private start;
    private tick;
    dispose(): void;
}
