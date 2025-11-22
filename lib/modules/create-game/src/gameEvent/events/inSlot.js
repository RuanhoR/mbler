import { EntityComponentTypes, world, } from "@minecraft/server";
import { Logger } from "../../utils/index.js";
/**当玩家指定槽位出现指定物品时触发 */
export class PlayerItemInSlotEventSignal {
    intervalEvent;
    tickSub = null;
    map = new Map();
    logger = new Logger(this.constructor.name);
    constructor(intervalEvent) {
        this.intervalEvent = intervalEvent;
    }
    subscribe(callback, options) {
        if (!this.tickSub) {
            this.tickSub = this.intervalEvent.subscribe(this.tick.bind(this));
        }
        const data = {
            ...options,
            callback: callback,
        };
        let slot = this.map.get(options.slot);
        if (!slot) {
            slot = new Set();
            this.map.set(options.slot, slot);
        }
        slot.add(data);
        return this.wrapUnsubscribe(data);
    }
    wrapUnsubscribe(data) {
        return {
            unsubscribe: () => {
                const slot = this.map.get(data.slot);
                if (!slot)
                    return;
                slot.delete(data);
                if (slot.size == 0) {
                    this.map.delete(data.slot);
                }
                this.cleanUp();
            },
        };
    }
    cleanUp() {
        if (this.map.size == 0 && this.tickSub) {
            this.tickSub?.unsubscribe();
            this.tickSub = null;
        }
    }
    tick() {
        for (let player of world.getAllPlayers()) {
            if (!player || !player.isValid)
                continue;
            const equipComponent = player.getComponent(EntityComponentTypes.Equippable);
            if (!equipComponent)
                continue;
            for (const [equip, list] of this.map.entries()) {
                const item = equipComponent.getEquipment(equip);
                if (!item)
                    continue;
                for (const data of list) {
                    if (item.typeId === data.itemId &&
                        (!data.group || data.group.has(player))) {
                        try {
                            data.callback({ item, player });
                        }
                        catch (err) {
                            this.logger.error("回调执行错误", err);
                        }
                    }
                }
            }
        }
    }
}
