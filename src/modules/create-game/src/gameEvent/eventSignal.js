import { Logger } from "../utils/logger.js";
/**自定义事件 */
export class BasicCustomEventSignal {
    set = new Set();
    logger = new Logger(this.constructor.name);
    // 取消订阅
    unsubscribe(item) {
        if (this.set.has(item)) {
            this.set.delete(item);
        }
    }
    // 发布事件，执行所有回调
    publish(data) {
        const callbacksCopy = [...this.set];
        for (const cb of callbacksCopy) {
            try {
                this.runCallback(cb, data);
            }
            catch (e) {
                this.logger.error("Callback error:", e);
            }
        }
    }
}
