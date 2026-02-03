import { Player } from "@minecraft/server";
import { GameRegion } from "../../gameRegion/gameRegion.js";
import { CustomEventSignal } from "../eventSignal.js";
import { Subscription } from "../subscription.js";
import { IntervalEventSignal } from "./interval.js";
export declare enum RegionEventType {
    Enter = "enter",
    Leave = "leave"
}
export interface PlayerRegionEvent {
    readonly player: Player;
    readonly type: RegionEventType;
    readonly region: GameRegion;
}
export declare class PlayerRegionEventSignal implements CustomEventSignal<PlayerRegionEvent> {
    private readonly tickEvent;
    constructor(tickEvent: IntervalEventSignal);
    private logger;
    private subscription;
    private allSubscriptions;
    private regionStates;
    subscribe(callback: (event: PlayerRegionEvent) => void, region: GameRegion): Subscription;
    private startMonitoring;
    private stopMonitoring;
    private checkAllRegions;
    private publish;
    dispose(): void;
}
