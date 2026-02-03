import { Entity } from "@minecraft/server";
import { GamePlayer, PlayerGroup, PlayerGroupSet } from "../../gamePlayer/index.js";
import { GameState } from "../../gameState/index.js";
import { GameComponent } from "../index.js";
export interface RespawnComponentOptions<TPlayer extends GamePlayer, TData = unknown> {
    groupSet: PlayerGroupSet<TPlayer>;
    /** 玩家死亡时触发自定义逻辑*/
    onDie?: (player: TPlayer, group: PlayerGroup<TPlayer>, source?: Entity) => void;
    /**玩家重生时触发 */
    onSpawn?: (player: TPlayer, group: PlayerGroup<TPlayer, TData>) => void;
    /**是否自动广播消息（默认 false）*/
    autoBroadcast?: boolean;
    /**构建玩家显示名，用于广播消息*/
    buildNameFunc?: (player: TPlayer, group: PlayerGroup<TPlayer, TData>) => string;
    /**自定义消息构建 */
    buildMsg?: (playerName: string, killerName: string | undefined, player: TPlayer) => string;
}
export declare class RespawnComponent<TPlayer extends GamePlayer, TData = unknown> extends GameComponent<GameState, RespawnComponentOptions<TPlayer, TData>> {
    onAttach(): void;
    private getKillerName;
}
