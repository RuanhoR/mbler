import { PlayerInteractWithBlockBeforeEvent, Vector3 } from "@minecraft/server";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { DimensionIds } from "../../utils/vanila-data.js";
import { BaseMapEventSignal, SubscriptionData } from "../mapEventSignal.js";
interface SignClickData extends SubscriptionData<PlayerInteractWithBlockBeforeEvent> {
    players?: PlayerGroup<any>;
    lastClick: number;
    clickInterval: number;
}
export interface SignClickEventOptions {
    dimensionId: DimensionIds;
    loc: Vector3;
    players?: PlayerGroup<any>;
    /**两次点击的最小间隔(默认1)，0表示无间隔 */
    clickInterval?: number;
}
export declare class SignClickEventSignal extends BaseMapEventSignal<string, PlayerInteractWithBlockBeforeEvent, SignClickData, SignClickEventOptions> {
    private readonly signId;
    protected buildKey(options: SignClickEventOptions): string;
    protected buildData(callback: (event: PlayerInteractWithBlockBeforeEvent) => void, options: SignClickEventOptions): SignClickData;
    protected extractKey(event: PlayerInteractWithBlockBeforeEvent): string;
    protected isTargetEvent(event: PlayerInteractWithBlockBeforeEvent): boolean;
    protected filter(data: SignClickData, event: PlayerInteractWithBlockBeforeEvent): boolean;
    protected subscribeNative(cb: (e: PlayerInteractWithBlockBeforeEvent) => void): (e: PlayerInteractWithBlockBeforeEvent) => void;
    protected unsubscribeNative(cb: (e: PlayerInteractWithBlockBeforeEvent) => void): void;
}
export {};
