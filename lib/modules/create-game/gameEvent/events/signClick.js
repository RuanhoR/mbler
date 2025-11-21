import { system, world, } from "@minecraft/server";
import { BaseMapEventSignal } from "../mapEventSignal";
export class SignClickEventSignal extends BaseMapEventSignal {
    signId = "minecraft:wall_sign";
    buildKey(options) {
        const loc = options.loc;
        return `${options.dimensionId}-${loc.x}-${loc.y}-${loc.z}`;
    }
    buildData(callback, options) {
        return {
            callback,
            players: options.players,
            lastClick: system.currentTick,
            clickInterval: options.clickInterval ?? 1,
        };
    }
    extractKey(event) {
        const loc = event.block.location;
        return `${event.block.dimension.id}-${loc.x}-${loc.y}-${loc.z}`;
    }
    isTargetEvent(event) {
        return event.block.typeId === this.signId;
    }
    filter(data, event) {
        if (system.currentTick - data.lastClick < data.clickInterval) {
            return false;
        }
        if (data.players && !data.players.getById(event.player.id)) {
            return false;
        }
        data.lastClick = system.currentTick;
        return true;
    }
    subscribeNative(cb) {
        world.beforeEvents.playerInteractWithBlock.subscribe(cb);
        return cb;
    }
    unsubscribeNative(cb) {
        world.beforeEvents.playerInteractWithBlock.unsubscribe(cb);
    }
}
