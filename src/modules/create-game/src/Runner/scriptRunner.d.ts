export declare class ScriptCancelledError extends Error {
    constructor(id: string);
}
export declare class ScriptRunner {
    readonly id: string;
    private readonly onFinish;
    private cancelled;
    constructor(id: string, onFinish: (id: string) => void);
    private checkCancelled;
    wait(ticks: number): Promise<void>;
    do<T>(fn: () => T): T;
    do<T>(fn: () => Promise<T>): Promise<T>;
    runSteps(steps: Array<() => void | Promise<void>>): Promise<void>;
    doDelay<T>(fn: () => T | Promise<T>, ticks: number): Promise<T>;
    cancel(): void;
    run(script: (r: ScriptRunner) => Promise<void> | void): Promise<void>;
    isCancelled(): boolean;
}
