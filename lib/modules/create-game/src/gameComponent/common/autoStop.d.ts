import { TTLPlayer } from "../../gamePlayer/gamePlayer.js";
import { PlayerGroupSet } from "../../gamePlayer/groupSet.js";
import { GameComponent, GameState } from "../../main.js";
export interface AutoStopConfig<T extends TTLPlayer> {
    groupSet: PlayerGroupSet<T>;
    onLeave?: (p: T) => void;
    onStopGame: () => void;
    immediateDie?: boolean;
    shouldRelease?: boolean;
}
/**在组中所有玩家寄了之后自动结束游戏 */
export declare class AutoStopComponent<T extends TTLPlayer> extends GameComponent<GameState<T, any, any>, AutoStopConfig<T>> {
    onAttach(): void;
    tick(): void;
}
