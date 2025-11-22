import { Logger } from "../../../utils/index.js";
export class StopWatchTickEventSignal {
    tickCallbacks = new Set();
    logger = new Logger(this.constructor.name);
    constructor() { }
    /** 注册一个在每次时间增加（每秒）时执行的回调函数*/
    subscribe(callback) {
        this.tickCallbacks.add(callback);
        return {
            unsubscribe: () => {
                this.tickCallbacks.delete(callback);
            },
        };
    }
    publish(elapsedTime) {
        this.tickCallbacks.forEach((cb) => {
            try {
                cb({ elapsedTime: elapsedTime });
            }
            catch (err) {
                this.logger.error("stopWatch Tick事件执行错误", err);
            }
        });
    }
}
