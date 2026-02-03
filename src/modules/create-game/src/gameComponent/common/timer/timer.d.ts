import { GameState } from "../../../gameState/gameState.js";
import { GameComponent } from "../../gameComponent.js";
import { TimerOnTimeEventSignal } from "./onTimeEvent.js";
import { TimerTickEventSignal } from "./tickEvent.js";
export interface TimerOptions {
    /** 初始时间(s) 默认0*/
    initialTime?: number;
    /** 是否在附加到游戏时自动开始
     *
     * @default false
     */
    autoStart?: boolean;
    /**
     * 是否进行卡顿补偿，默认关闭 ;
     * 如果要严格计时，请开启
     */
    compensate?: boolean;
}
export declare class Timer extends GameComponent<GameState<any>, TimerOptions> {
    private remainingTime;
    private _isRunning;
    private lastTime;
    readonly events: {
        readonly tick: TimerTickEventSignal;
        readonly onTime: TimerOnTimeEventSignal;
    };
    /** 获取当前剩余时间 */
    get time(): Readonly<number>;
    /**获取计时器是否正在运行*/
    get isRunning(): Readonly<boolean>;
    /**
     * 组件被附加到游戏对象时调用
     */
    onAttach(): void;
    onDetach(): void;
    /** 设置计时器的当前时间 */
    set(time: number): void;
    /**停止计时器 */
    stop(): void;
    /**启动计时器 */
    start(): void;
}
