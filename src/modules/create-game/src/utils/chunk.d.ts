import { Entity, Vector3, VectorXZ } from "@minecraft/server";
import { DimensionIds } from "./vanila-data.js";
/**有关区块的工具 */
export declare class ChunkUtils {
    /**
     * 通过方块坐标获得该方块所在区块坐标
     * @param pos 方块的坐标
     * @returns 该方块所在区块的坐标
     */
    static getChunkPosFromBlockPos(pos: Vector3): VectorXZ;
    /**
     * 获取指定位置的区块中，全部的实体和玩家的ID列表
     * @param dimensionId 维度Id
     * @param pos 指定位置的坐标
     * @returns 实体和玩家的ID的列表，当指定位置的区块不存在或尚未加载时，返回空数组
     **/
    static getChunkEntities(dimensionId: DimensionIds, pos: Vector3): Entity[];
    /**
     * 获取某区块最大点的坐标
     * @param chunkPos 指定区块的坐标
     * @returns 该区块最大点的坐标
     */
    static getChunkMaxPos(chunkPos: VectorXZ): Vector3;
    /** 获取某区块最小点的坐标
     * @param chunkPos 指定区块的坐标
     * @returns 该区块最小点的坐标
     */
    static getChunkMinPos(chunkPos: VectorXZ): Vector3;
}
