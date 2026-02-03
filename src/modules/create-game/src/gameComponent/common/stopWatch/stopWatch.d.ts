import { GameState } from "../../../gameState/gameState.js";
import { GameComponent } from "../../gameComponent.js";
import { StopWatchOnTimeEventSignal } from "./onTimeEvent.js";
import { StopWatchTickEventSignal } from "./tickEvent.js";
export interface StopWatchOptions {
    /** 是否自动开始 */
    autoStart?: boolean;
    /** 是否补偿真实时间（防止掉帧时少算秒） */
    compensate?: boolean;
    /** 初始时间（可用于恢复上次状态） */
    initialTime?: number;
}
export declare class StopWatch extends GameComponent<GameState<any>, StopWatchOptions> {
    private elapsedTime;
    private _isRunning;
    private lastTime;
    private isActive;
    readonly events: {
        readonly tick: StopWatchTickEventSignal;
        readonly onTime: StopWatchOnTimeEventSignal;
    };
    /** 获取当前已计时间（秒） */
    get time(): Readonly<number>;
    /** 获取秒表是否正在运行 */
    get isRunning(): Readonly<boolean>;
    /** 组件被附加到游戏对象时调用 */
    onAttach(): void;
    onDetach(): void;
    /** 重置秒表时间 */
    reset(time?: number): void;
    /** 停止秒表 */
    stop(): void;
    /** 启动秒表 */
    start(): void;
    /** 暂停或恢复 */
    toggle(): void;
}
