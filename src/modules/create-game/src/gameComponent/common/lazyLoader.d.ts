import { Vector3 } from "@minecraft/server";
import { GameState } from "../../main.js";
import { Duration } from "../../utils/index.js";
import { DimensionIds } from "../../utils/vanila-data.js";
import { GameComponent, GameComponentType } from "../gameComponent.js";
export interface LazyLoadOptions {
    /** 要检测的维度 */
    dimensionId: DimensionIds;
    /** 用于检测是否加载的方块坐标 */
    pos: Vector3;
    /** 加载时的回调（区块首次加载时触发） */
    onLoad: (loader: LazyLoader) => void;
    /** 卸载时的回调（区块卸载时触发） */
    onUnload?: () => void;
    /** 检测间隔，默认 20 tick */
    interval?: Duration;
}
/**用于懒加载区块 */
export declare class LazyLoader extends GameComponent<GameState<any, any>, LazyLoadOptions> {
    private active;
    private logger;
    private components;
    get isActive(): boolean;
    onAttach(): void;
    private clearComponents;
    reload(): void;
    addComponent<C extends GameComponentType<any, any>>(component: C, options?: ConstructorParameters<C>[1]): this;
}
