import { Player, world } from "@minecraft/server";
import { BaseMapEventSignal } from "../mapEventSignal.js";
export class ItemUseEventSignal extends BaseMapEventSignal {
    buildKey(options) {
        return options.itemId;
    }
    buildData(callback, options) {
        return {
            callback,
            itemId: options.itemId,
            players: options.players,
        };
    }
    extractKey(event) {
        return event.itemStack.typeId ?? null;
    }
    filter(data, event) {
        if (event.source instanceof Player &&
            data.players &&
            !data.players.getById(event.source.id)) {
            return false;
        }
        return true;
    }
    subscribeNative(cb) {
        world.afterEvents.itemUse.subscribe(cb);
        return cb;
    }
    unsubscribeNative(cb) {
        world.afterEvents.itemUse.unsubscribe(cb);
    }
}
