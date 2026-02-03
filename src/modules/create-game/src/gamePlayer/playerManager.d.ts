import { Player } from "@minecraft/server";
import { GamePlayer, GamePlayerConstructor } from "./gamePlayer.js";
import { PlayerGroupBuilder } from "./groupBuilder.js";
/**游戏玩家管理器 */
export declare class GamePlayerManager<T extends GamePlayer = GamePlayer> {
    private readonly gameKey;
    private readonly isDaemon;
    private readonly players;
    readonly playerConstructor: GamePlayerConstructor<T>;
    /**玩家组构建器 */
    readonly groupBuilder: PlayerGroupBuilder<T>;
    constructor(playerConstructor: GamePlayerConstructor<T>, gameKey: string, isDaemon: boolean);
    /**获取游戏玩家(若玩家已分配，返回无效玩家) */
    get(p: Player): T;
    getAll(): T[];
    /**让玩家失活 */
    deactivate(p: Player): void;
    get size(): number;
    get validSize(): number;
    dispose(): void;
}
