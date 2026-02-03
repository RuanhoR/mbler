import { Logger } from "../../../utils/index.js";
export class TimerTickEventSignal {
    tickCallbacks = new Set();
    logger = new Logger(this.constructor.name);
    constructor() { }
    /** 注册一个在每次时间减少（每秒）时执行的回调函数*/
    subscribe(callback) {
        this.tickCallbacks.add(callback);
        return {
            unsubscribe: () => {
                this.tickCallbacks.delete(callback);
            },
        };
    }
    publish(remainingTime) {
        this.tickCallbacks.forEach((cb) => {
            try {
                cb({ remainingTime: remainingTime });
            }
            catch (err) {
                this.logger.error("timer Tick事件执行错误", err);
            }
        });
    }
}
