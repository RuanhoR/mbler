import { Dimension, Vector3 } from "@minecraft/server";
import { GamePlayer, PlayerGroup } from "../../gamePlayer/index.js";
import { GameState } from "../../gameState/index.js";
import { Duration } from "../../utils/index.js";
import { GameComponent } from "../gameComponent.js";
export interface SpawnPointProtectorOptions<P extends GamePlayer> {
    /**玩家组 */
    playerGroup: PlayerGroup<P>;
    /** 出生点 */
    spawnPoint: Vector3;
    /**维度 */
    dimension: Dimension;
    /** 是否循环设置玩家重生点 */
    autoSetSpawnPoint?: boolean;
    /** 循环保护出生点区域的间隔 */
    protectInterval?: Duration;
    /** 出生点保护范围，默认 1x1x1 */
    protectRadius?: Vector3;
}
export declare class SpawnPointProtector<P extends GamePlayer> extends GameComponent<GameState, SpawnPointProtectorOptions<P>> {
    onAttach(): void;
    /** 设置玩家重生点 */
    setPlayerSpawnPoints(): void;
    /** 传送所有玩家到出生点 */
    teleportAllToSpawn(): void;
    /** 循环保护出生点区域 */
    private protectSpawnAreas;
}
