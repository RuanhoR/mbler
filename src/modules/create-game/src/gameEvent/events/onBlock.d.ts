import { Block, Player } from "@minecraft/server";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { CustomEventSignal } from "../eventSignal.js";
import { Subscription } from "../subscription.js";
import { IntervalEventSignal } from "./interval.js";
export interface PlayerOnBlockEvent {
    player: Player;
    block: Block;
}
export interface PlayerOnBlockEventOption {
    group?: PlayerGroup<any>;
    typeIds?: string[];
}
export declare class PlayerOnBlockEventSignal implements CustomEventSignal<PlayerOnBlockEvent> {
    private readonly tickEvent;
    private readonly blockMap;
    private readonly globalSubs;
    private readonly logger;
    private static readonly BELOW_OFFSET;
    private subscription;
    constructor(tickEvent: IntervalEventSignal);
    subscribe(callback: (arg0: PlayerOnBlockEvent) => void, options?: PlayerOnBlockEventOption): Subscription;
    private wrapUnsubscribe;
    private cleanUp;
    private tick;
}
