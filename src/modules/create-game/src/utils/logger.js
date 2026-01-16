import { SAPIGameConfig } from "../config.js";
export var logLevel;
(function (logLevel) {
    logLevel[logLevel["debug"] = 0] = "debug";
    logLevel[logLevel["log"] = 1] = "log";
    logLevel[logLevel["warn"] = 2] = "warn";
    logLevel[logLevel["error"] = 3] = "error";
})(logLevel || (logLevel = {}));
export class Logger {
    name;
    constructor(name) {
        this.name = name;
    }
    get logLevel() {
        return SAPIGameConfig.config.logLevel;
    }
    debug(message, ...optionalParams) {
        if (this.logLevel <= logLevel.debug)
            console.log(`<Game-debug>[${this.name}] ${message}`, ...optionalParams);
    }
    log(message, ...optionalParams) {
        if (this.logLevel <= logLevel.log)
            console.log(`<Game-log>[${this.name}] ${message}`, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        if (this.logLevel <= logLevel.warn)
            console.warn(`<Game-warn>[${this.name}] ${message}`, ...optionalParams);
    }
    /**
     * 打印错误信息
     * @param message 消息
     * @param e 错误
     */
    error(message, e) {
        if (this.logLevel > logLevel.error)
            return;
        if (e instanceof Error) {
            console.error(`<Game-error>[${this.name}] ${message}`, e, e.stack);
        }
        else {
            console.error(`<Game-error>[${this.name}] ${message}`, e);
        }
    }
}
