import { Dimension } from "@minecraft/server";
import { DimensionIds } from "./utils/vanila-data.js";
type Dimensions = {
    [K in keyof typeof DimensionIds]: Dimension;
};
export declare const Dimensions: Dimensions;
export declare const Constants: {
    /**维度常量（游戏加载后可用） */
    readonly dimension: Dimensions;
};
export {};
