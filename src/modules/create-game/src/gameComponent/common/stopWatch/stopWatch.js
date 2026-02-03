import { Game } from "../../../main.js";
import { GameComponent } from "../../gameComponent.js";
import { StopWatchOnTimeEventSignal } from "./onTimeEvent.js";
import { StopWatchTickEventSignal } from "./tickEvent.js";
export class StopWatch extends GameComponent {
    elapsedTime = 0;
    _isRunning = false;
    lastTime = 0;
    isActive = true;
    events = {
        tick: new StopWatchTickEventSignal(),
        onTime: new StopWatchOnTimeEventSignal(),
    };
    /** 获取当前已计时间（秒） */
    get time() {
        return this.elapsedTime;
    }
    /** 获取秒表是否正在运行 */
    get isRunning() {
        return this._isRunning;
    }
    /** 组件被附加到游戏对象时调用 */
    onAttach() {
        this.isActive = true;
        this.elapsedTime = this.options?.initialTime ?? 0;
        if (this.options?.autoStart) {
            this.start();
        }
        // 订阅游戏的 tick 事件，驱动秒表
        this.subscribe(Game.events.interval, () => {
            if (!this._isRunning)
                return;
            const now = Date.now();
            const diff = now - this.lastTime;
            if (diff >= 1000) {
                if (this.options?.compensate) {
                    // 按真实时间补偿，防止掉帧少加
                    const steps = Math.floor(diff / 1000);
                    this.elapsedTime += steps;
                    this.lastTime += steps * 1000;
                }
                else {
                    // 不补偿，只加 1 秒
                    this.elapsedTime += 1;
                    this.lastTime = now;
                }
                // 每秒触发 tick
                this.events.tick.publish(this.elapsedTime);
                // 检查并触发特定时间事件
                this.events.onTime.checkAndFireTimeEvents(this.elapsedTime);
            }
        });
    }
    onDetach() {
        this._isRunning = false;
        this.isActive = false;
        super.onDetach();
        this.state.eventManager.unsubscribeByEvent(this.events.onTime);
        this.state.eventManager.unsubscribeByEvent(this.events.tick);
    }
    /** 重置秒表时间 */
    reset(time = 0) {
        this.elapsedTime = Math.max(0, time);
        this.lastTime = Date.now();
        if (this._isRunning) {
            this.events.tick.publish(this.elapsedTime);
        }
    }
    /** 停止秒表 */
    stop() {
        this._isRunning = false;
    }
    /** 启动秒表 */
    start() {
        if (!this._isRunning && this.isActive) {
            this._isRunning = true;
            this.lastTime = Date.now();
            this.events.tick.publish(this.elapsedTime);
            this.events.onTime.checkAndFireTimeEvents(this.elapsedTime);
        }
    }
    /** 暂停或恢复 */
    toggle() {
        this._isRunning ? this.stop() : this.start();
    }
}
