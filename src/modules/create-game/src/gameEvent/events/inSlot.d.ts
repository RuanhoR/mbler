import { EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { CustomEventSignal } from "../eventSignal.js";
import { Subscription } from "../subscription.js";
import { IntervalEventSignal } from "./interval.js";
export interface PlayerItemInSlotEvent {
    item: ItemStack;
    player: Player;
}
export interface PlayerItemInSlotOption {
    slot: EquipmentSlot;
    itemId: string;
    group?: PlayerGroup<any>;
}
interface PlayerItemInSlotData extends PlayerItemInSlotOption {
    callback: (arg0: PlayerItemInSlotEvent) => void;
}
/**当玩家指定槽位出现指定物品时触发 */
export declare class PlayerItemInSlotEventSignal implements CustomEventSignal<PlayerItemInSlotEvent> {
    private readonly intervalEvent;
    private tickSub;
    private readonly map;
    private readonly logger;
    constructor(intervalEvent: IntervalEventSignal);
    subscribe(callback: (arg0: PlayerItemInSlotEvent) => void, options: PlayerItemInSlotOption): Subscription;
    wrapUnsubscribe(data: PlayerItemInSlotData): Subscription;
    cleanUp(): void;
    tick(): void;
}
export {};
