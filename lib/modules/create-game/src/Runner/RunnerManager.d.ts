import { ScriptRunner } from "./scriptRunner.js";
export declare class RunnerManager {
    private runners;
    private idCounter;
    private readonly logger;
    constructor(stateName: string);
    /**返回一个新的scriptRunner(需手动捕获错误) */
    new(): {
        id: string;
        runner: ScriptRunner;
    };
    /**
     * 运行普通脚本
     */
    run(script: (runner: ScriptRunner) => Promise<void> | void): string;
    runDelay(script: (runner: ScriptRunner) => Promise<void> | void, ticks: number): string;
    /**
     * 使用游戏 runJob 运行 generator
     */
    runJob(generator: Generator<void, void, void>): {
        id: string;
        promise: Promise<void>;
    };
    /**
     * 取消指定 runner 或 job
     */
    cancel(id: string): boolean;
    /**
     * 取消所有 runner/job
     */
    dispose(): void;
    get size(): number;
}
