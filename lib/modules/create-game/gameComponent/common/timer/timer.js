import { Game } from "./../../main";
import { GameComponent } from "../../gameComponent";
import { TimerOnTimeEventSignal } from "./onTimeEvent";
import { TimerTickEventSignal } from "./tickEvent";
export class Timer extends GameComponent {
    remainingTime = 0;
    _isRunning = false;
    lastTime = 0;
    events = {
        tick: new TimerTickEventSignal(),
        onTime: new TimerOnTimeEventSignal(),
    };
    /** 获取当前剩余时间 */
    get time() {
        return this.remainingTime;
    }
    /**获取计时器是否正在运行*/
    get isRunning() {
        return this._isRunning;
    }
    /**
     * 组件被附加到游戏对象时调用
     */
    onAttach() {
        this.set(this.options?.initialTime ?? 0);
        // 订阅游戏的tick事件，这是驱动计时器的核心
        this.subscribe(Game.events.interval, () => {
            if (!this._isRunning) {
                return;
            }
            const now = Date.now();
            const diff = now - this.lastTime;
            if (diff >= 1000) {
                if (this.remainingTime <= 0) {
                    this._isRunning = false;
                    return;
                }
                if (this.options?.compensate) {
                    // 严格按真实时间走，补偿丢失的秒数
                    const steps = Math.floor(diff / 1000);
                    this.remainingTime -= steps;
                    this.lastTime += steps * 1000;
                }
                else {
                    // 不补偿，直接视为 1 秒过去
                    this.remainingTime -= 1;
                    this.lastTime = now;
                }
                // 执行每一秒的回调
                this.events.tick.publish(this.remainingTime);
                // 检查并执行特定时间点的事件
                this.events.onTime.checkAndFireTimeEvents(this.remainingTime);
            }
        });
        if (this.options?.autoStart) {
            this.start();
        }
    }
    onDetach() {
        this._isRunning = false;
        super.onDetach();
        this.state.eventManager.unsubscribeByEvent(this.events.onTime);
        this.state.eventManager.unsubscribeByEvent(this.events.tick);
    }
    /** 设置计时器的当前时间 */
    set(time) {
        this.remainingTime = Math.max(0, time);
        this.lastTime = Date.now();
    }
    /**停止计时器 */
    stop() {
        this._isRunning = false;
    }
    /**启动计时器 */
    start() {
        if (this.remainingTime > 0 && !this._isRunning && this.isAttached) {
            this._isRunning = true;
            this.lastTime = Date.now();
            this.events.tick.publish(this.remainingTime);
            this.events.onTime.checkAndFireTimeEvents(this.remainingTime);
        }
    }
}
