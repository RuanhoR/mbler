import { ButtonPushEventSignal } from "./events/buttonPush.js";
import { PlayerItemInSlotEventSignal } from "./events/inSlot.js";
import { IntervalEventSignal } from "./events/interval.js";
import { ItemUseEventSignal } from "./events/itemUse.js";
import { PlayerOnBlockEventSignal } from "./events/onBlock.js";
import { PlayerRegionEventSignal } from "./events/regionEvents.js";
import { SignClickEventSignal } from "./events/signClick.js";
export declare class gameEvents {
    /**间隔时间事件 */
    readonly interval: IntervalEventSignal;
    /**按钮按下事件 */
    readonly buttonPush: ButtonPushEventSignal;
    /**木牌被点击事件 */
    readonly signClick: SignClickEventSignal;
    /**物品使用事件 */
    readonly itemUse: ItemUseEventSignal;
    /**玩家区域事件 */
    readonly region: PlayerRegionEventSignal;
    /**玩家在方块上事件 */
    readonly onBlock: PlayerOnBlockEventSignal;
    /**玩家物品在指定槽位事件 */
    readonly inSlot: PlayerItemInSlotEventSignal;
    constructor();
}
export * from "./events/buttonPush.js";
export * from "./events/inSlot.js";
export * from "./events/interval.js";
export * from "./events/itemUse.js";
export * from "./events/onBlock.js";
export * from "./events/regionEvents.js";
export * from "./events/signClick.js";
