import { world } from "@minecraft/server";
import { PlayerGroup } from "./playerGroup.js";
/**玩家组构建器 */
export class PlayerGroupBuilder {
    playerManager;
    constructor(manager) {
        this.playerManager = manager;
    }
    /**创建空的玩家组 */
    emptyGroup(...rest) {
        return new PlayerGroup(this.playerManager.playerConstructor, [], rest[0]);
    }
    /** 从原生 Player 创建 PlayerGroup 并映射到 playerManager */
    fromPlayers(players, ...rest) {
        return new PlayerGroup(this.playerManager.playerConstructor, players.map((p) => this.playerManager.get(p)), rest[0]);
    }
    /** 从已有 PlayerGroup 创建 engine PlayerGroup */
    fromGroup(group, ...rest) {
        return new PlayerGroup(this.playerManager.playerConstructor, group.getAllPlayers().map((p) => this.playerManager.get(p)), rest[0]);
    }
    /**从某个区域创建 */
    fromRegion(dim, region, ...rest) {
        const players = world
            .getDimension(dim)
            .getPlayers(region.getEntityQueryOption())
            .filter((p) => p != undefined);
        return new PlayerGroup(this.playerManager.playerConstructor, players.map((p) => this.playerManager.get(p)), rest[0]);
    }
    /**从所有玩家创建 */
    fromAll(...rest) {
        const players = world.getAllPlayers().filter((p) => p != undefined);
        return new PlayerGroup(this.playerManager.playerConstructor, players.map((p) => this.playerManager.get(p)), rest[0]);
    }
}
