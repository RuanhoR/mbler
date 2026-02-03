export declare enum logLevel {
    debug = 0,
    log = 1,
    warn = 2,
    error = 3
}
export declare class Logger {
    private name;
    constructor(name: string);
    private get logLevel();
    debug(message: string, ...optionalParams: any[]): void;
    log(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    /**
     * 打印错误信息
     * @param message 消息
     * @param e 错误
     */
    error(message: string, e?: unknown): void;
}
