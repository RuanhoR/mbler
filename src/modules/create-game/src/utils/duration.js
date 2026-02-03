export class Duration {
    _ticks;
    static ticksPerSecond = 20;
    static ticksPerMinute = 60 * Duration.ticksPerSecond;
    constructor(ticks) {
        this._ticks = ticks;
    }
    /** 获取持续时间的刻数 */
    get ticks() {
        return this._ticks;
    }
    toSeconds() {
        return this.ticks / Duration.ticksPerSecond;
    }
    static fromSeconds(seconds) {
        return new Duration(Math.floor(this.ticksPerSecond * seconds));
    }
    static fromMinutes(minutes) {
        return new Duration(Math.floor(this.ticksPerMinute * minutes));
    }
}
