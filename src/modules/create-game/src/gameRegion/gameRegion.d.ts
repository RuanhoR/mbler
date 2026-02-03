import { BlockVolume, EntityQueryOptions, Player, Vector2, Vector3 } from "@minecraft/server";
import { DimensionIds } from "../utils/vanila-data.js";
/**游戏区域 */
export declare abstract class GameRegion {
    dimensionId: DimensionIds;
    constructor(dimId: DimensionIds);
    abstract getEntityQueryOption(): EntityQueryOptions;
    abstract isInside(loc: any): boolean;
    abstract isBlockInside(loc: any): boolean;
    /**获取区域内的玩家 */
    getPlayersInRegion(): Player[];
    /**获取区域内实体 */
    getEntitesInRegion(options?: EntityQueryOptions): import("@minecraft/server").Entity[];
    /** 在区域内的玩家执行命令 */
    runCommandOnPlayers(commandString: string): void;
    /**对每个玩家执行操作 */
    forEachPlayer(callbackfn: (value: Player) => void): void;
}
/**立方体区域 */
export declare class CubeRegion extends GameRegion {
    readonly pos1: Vector3;
    readonly pos2: Vector3;
    constructor(dimId: DimensionIds, pos1: Vector3, pos2: Vector3);
    getEntityQueryOption(): EntityQueryOptions;
    /**判断是否在区域内 */
    isInside(loc: Vector3): boolean;
    /**判断方块是否在区域内 */
    isBlockInside(loc: Vector3): boolean;
    /**转换为BlockVolume */
    toVolume(): BlockVolume;
    /**获取大小 */
    getCapacity(): number;
    /**获取范围 */
    getBounds(): {
        x1: number;
        x2: number;
        y1: number;
        y2: number;
        z1: number;
        z2: number;
    };
    /**向外扩张区域 */
    outSet(distance: Vector3): CubeRegion;
    /**向内收缩区域（若收缩后无体积则返回 undefined） */
    inSet(distance: Vector3): CubeRegion | undefined;
    /**获取区域最大点坐标 */
    getMax(): Vector3;
    /**获取区域最小点坐标 */
    getMin(): Vector3;
}
/**球形区域 */
export declare class SphereRegion extends GameRegion {
    center: Vector3;
    r: number;
    rm?: number | undefined;
    constructor(dimId: DimensionIds, center: Vector3, r: number, rm?: number | undefined);
    getEntityQueryOption(): EntityQueryOptions;
    isInside(loc: Vector3): boolean;
    isBlockInside(loc: any): boolean;
}
export declare class CylinderRegion extends GameRegion {
    getEntityQueryOption(): EntityQueryOptions;
    isInside(loc: any): boolean;
    isBlockInside(loc: any): boolean;
}
/**平面区域 */
export declare class PlaneRegion extends GameRegion {
    pos1: Vector2;
    pos2: Vector2;
    constructor(dimId: DimensionIds, pos1: Vector2, pos2: Vector2);
    getEntityQueryOption(): EntityQueryOptions;
    isInside(loc: Vector2): boolean;
    isBlockInside(loc: any): boolean;
}
