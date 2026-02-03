import { BlockVolume, world, } from "@minecraft/server";
import { Vector3Utils } from "../utils/vector.js";
/**游戏区域 */
export class GameRegion {
    dimensionId;
    constructor(dimId) {
        this.dimensionId = dimId;
    }
    /**获取区域内的玩家 */
    getPlayersInRegion() {
        const result = [];
        const players = world.getAllPlayers();
        for (const player of players) {
            if (player == undefined)
                continue;
            if (player.dimension.id == this.dimensionId &&
                this.isInside(player.location)) {
                result.push(player);
            }
        }
        return result;
    }
    /**获取区域内实体 */
    getEntitesInRegion(options) {
        return world
            .getDimension(this.dimensionId)
            .getEntities({ ...this.getEntityQueryOption(), ...options })
            .filter((e) => e != undefined);
    }
    /** 在区域内的玩家执行命令 */
    runCommandOnPlayers(commandString) {
        this.getPlayersInRegion().forEach((p) => p.runCommand(commandString));
    }
    /**对每个玩家执行操作 */
    forEachPlayer(callbackfn) {
        this.getPlayersInRegion().forEach(callbackfn);
    }
}
/**立方体区域 */
export class CubeRegion extends GameRegion {
    pos1;
    pos2;
    constructor(dimId, pos1, pos2) {
        super(dimId);
        this.pos1 = pos1;
        this.pos2 = pos2;
    }
    getEntityQueryOption() {
        return {
            location: this.pos1,
            volume: Vector3Utils.subtract(this.pos2, this.pos1),
        };
    }
    /**判断是否在区域内 */
    isInside(loc) {
        const EPSILON = 0.00001;
        const minX = Math.min(this.pos1.x, this.pos2.x);
        const maxX = Math.max(this.pos1.x, this.pos2.x) + 1;
        const minY = Math.min(this.pos1.y, this.pos2.y);
        const maxY = Math.max(this.pos1.y, this.pos2.y) + 0.99;
        const minZ = Math.min(this.pos1.z, this.pos2.z);
        const maxZ = Math.max(this.pos1.z, this.pos2.z) + 1;
        const inX = loc.x + EPSILON >= minX && loc.x - EPSILON <= maxX;
        const inY = loc.y + EPSILON >= minY && loc.y - EPSILON <= maxY;
        const inZ = loc.z + EPSILON >= minZ && loc.z - EPSILON <= maxZ;
        return inX && inY && inZ;
    }
    /**判断方块是否在区域内 */
    isBlockInside(loc) {
        const minX = Math.min(this.pos1.x, this.pos2.x);
        const maxX = Math.max(this.pos1.x, this.pos2.x);
        const minY = Math.min(this.pos1.y, this.pos2.y);
        const maxY = Math.max(this.pos1.y, this.pos2.y);
        const minZ = Math.min(this.pos1.z, this.pos2.z);
        const maxZ = Math.max(this.pos1.z, this.pos2.z);
        const inX = loc.x >= minX && loc.x <= maxX;
        const inY = loc.y >= minY && loc.y <= maxY;
        const inZ = loc.z >= minZ && loc.z <= maxZ;
        return inX && inY && inZ;
    }
    /**转换为BlockVolume */
    toVolume() {
        return new BlockVolume(this.pos1, this.pos2);
    }
    /**获取大小 */
    getCapacity() {
        const dif = Vector3Utils.add(Vector3Utils.subtract(this.getMax(), this.getMin()), { x: 1, y: 1, z: 1 });
        return Math.abs(dif.x * dif.y * dif.z);
    }
    /**获取范围 */
    getBounds() {
        return {
            x1: this.pos1.x,
            x2: this.pos2.x,
            y1: this.pos1.y,
            y2: this.pos2.y,
            z1: this.pos1.z,
            z2: this.pos2.z,
        };
    }
    /**向外扩张区域 */
    outSet(distance) {
        const minX = Math.min(this.pos1.x, this.pos2.x) - distance.x;
        const maxX = Math.max(this.pos1.x, this.pos2.x) + distance.x;
        const minY = Math.min(this.pos1.y, this.pos2.y) - distance.y;
        const maxY = Math.max(this.pos1.y, this.pos2.y) + distance.y;
        const minZ = Math.min(this.pos1.z, this.pos2.z) - distance.z;
        const maxZ = Math.max(this.pos1.z, this.pos2.z) + distance.z;
        return new CubeRegion(this.dimensionId, { x: minX, y: minY, z: minZ }, { x: maxX, y: maxY, z: maxZ });
    }
    /**向内收缩区域（若收缩后无体积则返回 undefined） */
    inSet(distance) {
        const minX = Math.min(this.pos1.x, this.pos2.x) + distance.x;
        const maxX = Math.max(this.pos1.x, this.pos2.x) - distance.x;
        const minY = Math.min(this.pos1.y, this.pos2.y) + distance.y;
        const maxY = Math.max(this.pos1.y, this.pos2.y) - distance.y;
        const minZ = Math.min(this.pos1.z, this.pos2.z) + distance.z;
        const maxZ = Math.max(this.pos1.z, this.pos2.z) - distance.z;
        // 若某个维度缩没了
        if (minX >= maxX || minY >= maxY || minZ >= maxZ) {
            return undefined;
        }
        return new CubeRegion(this.dimensionId, { x: minX, y: minY, z: minZ }, { x: maxX, y: maxY, z: maxZ });
    }
    /**获取区域最大点坐标 */
    getMax() {
        return {
            x: Math.max(this.pos1.x, this.pos2.x),
            y: Math.max(this.pos1.y, this.pos2.y),
            z: Math.max(this.pos1.z, this.pos2.z),
        };
    }
    /**获取区域最小点坐标 */
    getMin() {
        return {
            x: Math.min(this.pos1.x, this.pos2.x),
            y: Math.min(this.pos1.y, this.pos2.y),
            z: Math.min(this.pos1.z, this.pos2.z),
        };
    }
}
/**球形区域 */
export class SphereRegion extends GameRegion {
    center;
    r;
    rm;
    constructor(dimId, center, r, rm) {
        super(dimId);
        this.center = center;
        this.r = r;
        this.rm = rm;
    }
    getEntityQueryOption() {
        return {
            location: this.center,
            maxDistance: this.r,
            minDistance: this.rm,
        };
    }
    isInside(loc) {
        const distance = Vector3Utils.squaredDistance(this.center, loc);
        return distance <= this.r * this.r;
    }
    isBlockInside(loc) {
        return this.isInside(loc);
    }
}
export class CylinderRegion extends GameRegion {
    getEntityQueryOption() {
        throw new Error("Method not implemented.");
    }
    isInside(loc) {
        throw new Error("Method not implemented.");
    }
    isBlockInside(loc) {
        return this.isInside(loc);
    }
}
/**平面区域 */
export class PlaneRegion extends GameRegion {
    pos1;
    pos2;
    constructor(dimId, pos1, pos2) {
        super(dimId);
        this.pos1 = pos1;
        this.pos2 = pos2;
    }
    getEntityQueryOption() {
        return {
            location: {
                x: this.pos1.x,
                y: -1000,
                z: this.pos1.y,
            },
            volume: {
                x: this.pos2.x - this.pos1.x,
                z: this.pos2.y - this.pos1.y,
                y: 2000,
            },
        };
    }
    isInside(loc) {
        const EPSILON = 0.00001;
        const minX = Math.min(this.pos1.x, this.pos2.x);
        const maxX = Math.max(this.pos1.x, this.pos2.x) + 1;
        const minY = Math.min(this.pos1.y, this.pos2.y);
        const maxY = Math.max(this.pos1.y, this.pos2.y) + 1;
        const inX = loc.x + EPSILON >= minX && loc.x - EPSILON <= maxX;
        const inY = loc.y + EPSILON >= minY && loc.y - EPSILON <= maxY;
        return inX && inY;
    }
    isBlockInside(loc) {
        const minX = Math.min(this.pos1.x, this.pos2.x);
        const maxX = Math.max(this.pos1.x, this.pos2.x);
        const minY = Math.min(this.pos1.y, this.pos2.y);
        const maxY = Math.max(this.pos1.y, this.pos2.y);
        const inX = loc.x >= minX && loc.x <= maxX;
        const inY = loc.y >= minY && loc.y <= maxY;
        return inX && inY;
    }
}
