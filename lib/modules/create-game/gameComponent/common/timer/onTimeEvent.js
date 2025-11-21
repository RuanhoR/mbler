import { Logger } from "./../../utils/logger";
export class TimerOnTimeEventSignal {
    logger = new Logger(this.constructor.name);
    events = [];
    subscribe(callback, options) {
        const event = {
            time: options.time,
            callback,
            once: options.once ?? true,
        };
        this.events.push(event);
        return {
            unsubscribe: () => {
                this.events = this.events.filter((e) => e !== event);
            },
        };
    }
    /**检查并触发到达时间的事件*/
    checkAndFireTimeEvents(time) {
        const eventsToFire = this.events.filter((event) => time === event.time);
        eventsToFire.forEach((event) => {
            try {
                event.callback();
            }
            catch (e) {
                this.logger.error("执行timer事件失败:", e);
            }
        });
        // 如果配置为once，则在执行后移除
        this.events = this.events.filter((event) => !event.once || !eventsToFire.includes(event));
    }
}
