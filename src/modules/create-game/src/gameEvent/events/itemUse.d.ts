import { ItemUseAfterEvent } from "@minecraft/server";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { BaseMapEventSignal, SubscriptionData } from "../mapEventSignal.js";
export interface itemData extends SubscriptionData<ItemUseAfterEvent> {
    itemId: string;
    players?: PlayerGroup<any>;
}
export interface itemEventOptions {
    itemId: string;
    players?: PlayerGroup<any>;
}
export declare class ItemUseEventSignal extends BaseMapEventSignal<string, ItemUseAfterEvent, itemData, itemEventOptions> {
    protected buildKey(options: itemData): string;
    protected buildData(callback: (e: ItemUseAfterEvent) => void, options: itemData): itemData;
    protected extractKey(event: ItemUseAfterEvent): string | null;
    protected filter(data: itemData, event: ItemUseAfterEvent): boolean;
    protected subscribeNative(cb: (e: ItemUseAfterEvent) => void): (e: ItemUseAfterEvent) => void;
    protected unsubscribeNative(cb: (e: ItemUseAfterEvent) => void): void;
}
