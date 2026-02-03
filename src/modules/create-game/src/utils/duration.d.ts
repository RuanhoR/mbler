export declare class Duration {
    private readonly _ticks;
    static readonly ticksPerSecond = 20;
    static readonly ticksPerMinute: number;
    constructor(ticks: number);
    /** 获取持续时间的刻数 */
    get ticks(): number;
    toSeconds(): number;
    static fromSeconds(seconds: number): Duration;
    static fromMinutes(minutes: number): Duration;
}
