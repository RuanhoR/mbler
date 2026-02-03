import { ButtonPushAfterEvent } from "@minecraft/server";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { DimensionIds } from "../../utils/vanila-data.js";
import { BaseMapEventSignal, SubscriptionData } from "../mapEventSignal.js";
interface ButtonData extends SubscriptionData<ButtonPushAfterEvent> {
    players?: PlayerGroup<any>;
    sourceType?: string;
}
export interface ButtonPushEventOptions {
    dimensionId: DimensionIds;
    loc: [number, number, number];
    players?: PlayerGroup<any>;
    sourceType?: string;
}
export declare class ButtonPushEventSignal extends BaseMapEventSignal<string, ButtonPushAfterEvent, ButtonData, ButtonPushEventOptions> {
    protected buildKey(options: ButtonPushEventOptions): string;
    protected buildData(callback: (event: ButtonPushAfterEvent) => void, options: ButtonPushEventOptions): ButtonData;
    protected extractKey(event: ButtonPushAfterEvent): string;
    protected filter(data: ButtonData, event: ButtonPushAfterEvent): boolean;
    protected subscribeNative(cb: (e: ButtonPushAfterEvent) => void): (e: ButtonPushAfterEvent) => void;
    protected unsubscribeNative(cb: (e: ButtonPushAfterEvent) => void): void;
}
export {};
