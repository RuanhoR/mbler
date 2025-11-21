import { Player, world } from "@minecraft/server";
import { Vector3Utils } from "../../utils/vector";
import { BaseMapEventSignal } from "../mapEventSignal";
export class ButtonPushEventSignal extends BaseMapEventSignal {
    buildKey(options) {
        const loc = Vector3Utils.fromArray(options.loc);
        return `${options.dimensionId}-${loc.x}-${loc.y}-${loc.z}`;
    }
    buildData(callback, options) {
        return {
            callback,
            players: options.players,
            sourceType: options.sourceType,
        };
    }
    extractKey(event) {
        const loc = event.block.location;
        return `${event.dimension.id}-${loc.x}-${loc.y}-${loc.z}`;
    }
    filter(data, event) {
        if (data.sourceType && event.source.typeId !== data.sourceType)
            return false;
        if (event.source instanceof Player &&
            data.players &&
            !data.players.getById(event.source.id)) {
            return false;
        }
        return true;
    }
    subscribeNative(cb) {
        world.afterEvents.buttonPush.subscribe(cb);
        return cb;
    }
    unsubscribeNative(cb) {
        world.afterEvents.buttonPush.unsubscribe(cb);
    }
}
