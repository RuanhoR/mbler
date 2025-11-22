import { Player } from "@minecraft/server";
/**内部接口,勿用 */
export interface globalPlayerManagerInternal {
    releaseAllPlayerFromGame(gameKey: string): void;
    allocatePlayerToGame(playerId: string, gameKey: string): boolean;
}
export declare class globalPlayerManager {
    private readonly players;
    private readonly logger;
    constructor();
    /** 玩家是否已被分配（不修改状态） */
    isPlayerAllocated(playerId: string): boolean;
    /**请求分配玩家
     * 系统调用
     * @returns boolean 是否成功分配
     */
    protected allocatePlayerToGame(playerId: string, gameKey: string): boolean;
    /**将玩家从指定游戏释放
     * 系统调用
     */
    protected releaseAllPlayerFromGame(gameKey: string): void;
    /**将玩家从指定游戏释放 */
    releasePlayerFromGame(playerId: string, gameKey: string): void;
    /**强制释放玩家 */
    forceReleaseFromGame(playerId: string): void;
    /**获取所有在线且没有分配游戏的玩家 */
    getFreePlayers(): Player[];
    private tick;
    status(): string;
}
