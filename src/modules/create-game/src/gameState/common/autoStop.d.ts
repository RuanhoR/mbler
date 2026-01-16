import { TTLPlayer } from "../../gamePlayer/gamePlayer.js";
import { PlayerGroupSet } from "../../gamePlayer/groupSet.js";
import { GameState } from "../../main.js";
interface AutoStopStateConfig<T extends TTLPlayer> {
    groupSet: PlayerGroupSet<T>;
    onLeave?: (p: T) => void;
    /**是否立即离开(下线就死)  默认否*/
    immediateDie?: boolean;
    /**是否释放玩家 默认是 */
    shouldRelease?: boolean;
}
/**自动在groupSet所有玩家寄了之后停止游戏 */
export declare class AutoStopState<T extends TTLPlayer = any> extends GameState<T, any, AutoStopStateConfig<T>> {
    onEnter(): void;
    tick(): void;
}
export {};
