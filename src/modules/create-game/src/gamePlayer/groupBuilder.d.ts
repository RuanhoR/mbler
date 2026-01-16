import { Player } from "@minecraft/server";
import { GameRegion } from "../gameRegion/gameRegion.js";
import { DimensionIds } from "../utils/vanila-data.js";
import { GamePlayer } from "./gamePlayer.js";
import { PlayerGroup } from "./playerGroup.js";
import { GamePlayerManager } from "./playerManager.js";
/**玩家组构建器 */
export declare class PlayerGroupBuilder<T extends GamePlayer = GamePlayer> {
    playerManager: GamePlayerManager<T>;
    constructor(manager: GamePlayerManager<T>);
    /**创建空的玩家组 */
    emptyGroup<TData = undefined>(...rest: TData extends undefined ? [] : [data: TData]): PlayerGroup<T, TData>;
    /** 从原生 Player 创建 PlayerGroup 并映射到 playerManager */
    fromPlayers<TData = undefined>(players: Player[], ...rest: TData extends undefined ? [] : [data: TData]): PlayerGroup<T, TData>;
    /** 从已有 PlayerGroup 创建 engine PlayerGroup */
    fromGroup<TData = undefined>(group: PlayerGroup<any>, ...rest: TData extends undefined ? [] : [data: TData]): PlayerGroup<T, TData>;
    /**从某个区域创建 */
    fromRegion<TData = unknown>(dim: DimensionIds, region: GameRegion, ...rest: TData extends undefined ? [] : [data: TData]): PlayerGroup<T, TData>;
    /**从所有玩家创建 */
    fromAll<TData = unknown>(...rest: TData extends undefined ? [] : [data: TData]): PlayerGroup<T, TData>;
}
