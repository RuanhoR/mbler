import { world, } from "@minecraft/server";
import { DimensionIds } from "../utils/vanila-data.js";
/**游戏结构 */
export class GameStructure {
    id;
    dim;
    loc;
    /**
     * 构造一个游戏结构
     * @param id 结构id
     * @param loc 结构放置坐标
     * @param dim 结构维度(默认主世界)
     */
    constructor(id, loc, dim = DimensionIds.Overworld) {
        this.id = id;
        this.dim = dim;
        this.loc = loc;
    }
    /**获取结构 */
    get() {
        return world.structureManager.get(this.id);
    }
    /**放在默认的位置 */
    place(options) {
        const dim = world.getDimension(this.dim);
        world.structureManager.place(this.id, dim, this.loc, options);
    }
    /**放在指定地点 */
    placeOn(loc, dim, options) {
        world.structureManager.place(this.id, dim, loc, options);
    }
}
