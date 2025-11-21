import { system } from "@minecraft/server";
import { Logger } from "./../../utils";
/** 间隔时间事件 */
export class IntervalEventSignal {
    intervalId = null;
    items = new Set();
    logger = new Logger(this.constructor.name);
    subscribe(callback, interval) {
        //启动interval
        if (!this.intervalId)
            this.start();
        //添加到set
        const data = {
            callback: callback,
            interval: interval?.ticks ?? 0,
            tickCount: interval?.ticks ?? 1,
        };
        this.items.add(data);
        //返回取消订阅方法
        return {
            unsubscribe: () => this.items.delete(data),
        };
    }
    start() {
        this.intervalId = system.runInterval(() => this.tick());
    }
    tick() {
        for (const item of this.items) {
            item.tickCount--;
            if (item.tickCount <= 0) {
                try {
                    item.callback();
                }
                catch (e) {
                    this.logger.error("Interval callback error:", e);
                }
                item.tickCount = item.interval;
            }
        }
    }
    dispose() {
        if (this.intervalId !== null) {
            this.items.clear();
            system.clearRun(this.intervalId);
        }
    }
}
