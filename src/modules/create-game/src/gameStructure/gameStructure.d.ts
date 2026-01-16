import { Dimension, StructurePlaceOptions, Vector3 } from "@minecraft/server";
import { DimensionIds } from "../utils/vanila-data.js";
/**游戏结构 */
export declare class GameStructure {
    readonly id: string;
    readonly dim: DimensionIds;
    readonly loc: Vector3;
    /**
     * 构造一个游戏结构
     * @param id 结构id
     * @param loc 结构放置坐标
     * @param dim 结构维度(默认主世界)
     */
    constructor(id: string, loc: Vector3, dim?: DimensionIds);
    /**获取结构 */
    get(): import("@minecraft/server").Structure | undefined;
    /**放在默认的位置 */
    place(options?: StructurePlaceOptions): void;
    /**放在指定地点 */
    placeOn(loc: Vector3, dim: Dimension, options?: StructurePlaceOptions): void;
}
