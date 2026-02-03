import { world } from "@minecraft/server";
import { difference } from "../../utils/func.js";
import { Logger } from "../../utils/logger.js";
import { DimensionIds } from "../../utils/vanila-data.js";
export var RegionEventType;
(function (RegionEventType) {
    RegionEventType["Enter"] = "enter";
    RegionEventType["Leave"] = "leave";
})(RegionEventType || (RegionEventType = {}));
export class PlayerRegionEventSignal {
    tickEvent;
    constructor(tickEvent) {
        this.tickEvent = tickEvent;
    }
    logger = new Logger(this.constructor.name);
    subscription = null;
    allSubscriptions = new Set();
    // 每个 region 当前的玩家状态
    regionStates = new Map();
    subscribe(callback, region) {
        const subscription = { callback, region };
        this.allSubscriptions.add(subscription);
        // 初始化状态
        if (!this.regionStates.has(region)) {
            this.regionStates.set(region, new Set());
        }
        if (this.subscription === null) {
            this.startMonitoring();
        }
        return {
            unsubscribe: () => {
                this.allSubscriptions.delete(subscription);
                // 如果 region 没有订阅者了，清理它的状态
                if (![...this.allSubscriptions].some((sub) => sub.region === region)) {
                    this.regionStates.delete(region);
                }
                if (this.allSubscriptions.size === 0) {
                    this.stopMonitoring();
                }
            },
        };
    }
    startMonitoring() {
        this.logger.debug("启动玩家区域观测");
        this.subscription = this.tickEvent.subscribe(this.checkAllRegions.bind(this));
    }
    stopMonitoring() {
        if (this.subscription !== null) {
            this.logger.debug("停止玩家区域观测");
            this.subscription.unsubscribe();
            this.subscription = null;
            this.regionStates.clear();
        }
    }
    checkAllRegions() {
        // 1. 按维度收集所有玩家
        const players = world.getAllPlayers().filter((p) => p != undefined);
        const playersByDimension = {};
        const dimensions = Object.values(DimensionIds);
        for (const dim of dimensions) {
            playersByDimension[dim] = players.filter((p) => p.dimension.id === dim);
        }
        // 2. 遍历所有订阅区域
        for (const sub of this.allSubscriptions) {
            const region = sub.region;
            const prevPlayers = this.regionStates.get(region) ?? new Set();
            const dimensionPlayers = playersByDimension[region.dimensionId] ?? [];
            const currPlayers = new Set(dimensionPlayers
                .filter((p) => region.isInside(p.location))
                .map((p) => p.id));
            // 进入事件
            for (const playerId of difference(currPlayers, prevPlayers)) {
                const player = dimensionPlayers.find((p) => p.id === playerId);
                this.publish(player, RegionEventType.Enter, sub);
            }
            //离开事件
            for (const playerId of difference(prevPlayers, currPlayers)) {
                const player = players.find((p) => p.id === playerId);
                if (player)
                    this.publish(player, RegionEventType.Leave, sub);
            }
            // 更新状态
            this.regionStates.set(region, currPlayers);
        }
    }
    publish(player, type, subscription) {
        try {
            subscription.callback({
                player,
                type,
                region: subscription.region,
            });
        }
        catch (e) {
            this.logger.error("Region event callback error:", e);
        }
    }
    dispose() {
        this.stopMonitoring();
        this.allSubscriptions.clear();
    }
}
