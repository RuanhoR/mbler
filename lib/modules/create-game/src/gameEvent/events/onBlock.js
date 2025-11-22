import { world } from "@minecraft/server";
import { Logger, Vector3Utils } from "../../utils/index.js";
export class PlayerOnBlockEventSignal {
    tickEvent;
    blockMap = new Map();
    globalSubs = new Set();
    logger = new Logger(this.constructor.name);
    static BELOW_OFFSET = { x: 0, y: 0.02, z: 0 };
    subscription = null;
    constructor(tickEvent) {
        this.tickEvent = tickEvent;
    }
    subscribe(callback, options) {
        if (!this.subscription) {
            this.subscription = this.tickEvent.subscribe(this.tick.bind(this));
        }
        const typeIds = options?.typeIds;
        const data = {
            group: options?.group,
            callback,
            typeIds,
        };
        // 1) 没传 typeIds → 全局订阅
        if (!typeIds || typeIds.length === 0) {
            this.globalSubs.add(data);
            return this.wrapUnsubscribe(() => this.globalSubs.delete(data));
        }
        // 2) 传了 1 个 typeId → 用 map 存储
        if (typeIds.length === 1) {
            const typeId = typeIds[0];
            const set = this.blockMap.get(typeId) ?? new Set();
            set.add(data);
            this.blockMap.set(typeId, set);
            return this.wrapUnsubscribe(() => {
                const list = this.blockMap.get(typeId);
                if (list) {
                    list.delete(data);
                    if (list.size === 0) {
                        this.blockMap.delete(typeId);
                    }
                }
            });
        }
        // 3) 多个 typeId → 放到 globalSubs，tick 时筛选
        this.globalSubs.add(data);
        return this.wrapUnsubscribe(() => this.globalSubs.delete(data));
    }
    wrapUnsubscribe(remove) {
        return {
            unsubscribe: () => {
                remove();
                if (this.blockMap.size === 0 && this.globalSubs.size === 0) {
                    this.cleanUp();
                }
            },
        };
    }
    cleanUp() {
        this.subscription?.unsubscribe();
        this.subscription = null;
    }
    tick() {
        for (const p of world.getAllPlayers()) {
            if (p == undefined || !p.isValid)
                continue;
            //如果超过高度范围，跳过
            if (p.location.y < p.dimension.heightRange.min ||
                p.location.y > p.dimension.heightRange.max)
                continue;
            const block = p.dimension.getBlock(Vector3Utils.subtract(p.location, PlayerOnBlockEventSignal.BELOW_OFFSET));
            if (!block)
                continue;
            // 1) 全局订阅（含多 typeId 的订阅）
            for (const data of this.globalSubs) {
                if (data.group && !data.group.getById(p.id))
                    continue;
                if (data.typeIds && !data.typeIds.includes(block.typeId))
                    continue;
                try {
                    data.callback({ player: p, block });
                }
                catch (e) {
                    this.logger.error("回调执行错误", e);
                }
            }
            // 2) 精确 typeId 的订阅
            const list = this.blockMap.get(block.typeId);
            if (list) {
                for (const data of list) {
                    if (data.group && !data.group.getById(p.id))
                        continue;
                    try {
                        data.callback({ player: p, block });
                    }
                    catch (e) {
                        this.logger.error("回调执行错误", e);
                    }
                }
            }
        }
    }
}
