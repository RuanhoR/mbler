import { CustomEventSignal } from "../../../gameEvent/eventSignal.js";
import { Subscription } from "../../../gameEvent/subscription.js";
export declare class StopWatchOnTimeEventSignal implements CustomEventSignal<void> {
    private readonly logger;
    private events;
    subscribe(callback: () => void, options: {
        time: number;
        once?: boolean;
    }): Subscription;
    /**检查并触发到达时间的事件*/
    checkAndFireTimeEvents(time: number): void;
}
