import { world } from "@minecraft/server";
import { createDeferredObject } from "./utils/deferredObject.js";
import { DimensionIds } from "./utils/vanila-data.js";
const { proxy: dims, setTarget } = createDeferredObject();
world.afterEvents.worldLoad.subscribe(() => {
    setTarget({
        Overworld: world.getDimension(DimensionIds.Overworld),
        Nether: world.getDimension(DimensionIds.Nether),
        End: world.getDimension(DimensionIds.End),
    });
});
export const Dimensions = dims;
export const Constants = {
    /**维度常量（游戏加载后可用） */
    dimension: dims,
};
