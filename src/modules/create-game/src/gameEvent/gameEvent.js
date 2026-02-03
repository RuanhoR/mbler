import { ButtonPushEventSignal } from "./events/buttonPush.js";
import { PlayerItemInSlotEventSignal } from "./events/inSlot.js";
import { IntervalEventSignal } from "./events/interval.js";
import { ItemUseEventSignal } from "./events/itemUse.js";
import { PlayerOnBlockEventSignal } from "./events/onBlock.js";
import { PlayerRegionEventSignal } from "./events/regionEvents.js";
import { SignClickEventSignal } from "./events/signClick.js";
export class gameEvents {
    /**间隔时间事件 */
    interval;
    /**按钮按下事件 */
    buttonPush = new ButtonPushEventSignal();
    /**木牌被点击事件 */
    signClick = new SignClickEventSignal();
    /**物品使用事件 */
    itemUse = new ItemUseEventSignal();
    /**玩家区域事件 */
    region;
    /**玩家在方块上事件 */
    onBlock;
    /**玩家物品在指定槽位事件 */
    inSlot;
    constructor() {
        this.interval = new IntervalEventSignal();
        this.region = new PlayerRegionEventSignal(this.interval);
        this.onBlock = new PlayerOnBlockEventSignal(this.interval);
        this.inSlot = new PlayerItemInSlotEventSignal(this.interval);
    }
}
export * from "./events/buttonPush.js";
export * from "./events/inSlot.js";
export * from "./events/interval.js";
export * from "./events/itemUse.js";
export * from "./events/onBlock.js";
export * from "./events/regionEvents.js";
export * from "./events/signClick.js";
