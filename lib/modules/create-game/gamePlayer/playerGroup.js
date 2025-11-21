import { GameError } from "../utils/GameError";
class PlayerGroupError extends GameError {
    constructor(mes, options) {
        super(mes, options);
        this.name = this.constructor.name;
    }
}
/**玩家组 */
export class PlayerGroup {
    players;
    playerConstructor;
    data;
    constructor(playerClass, players, data) {
        this.playerConstructor = playerClass;
        if (players != undefined &&
            players.some((p) => !(p instanceof playerClass))) {
            throw new PlayerGroupError(`players必须全为:${playerClass.name}`);
        }
        this.data = data;
        this.players = players ?? [];
    }
    /** 组中玩家数量(包含下线玩家) */
    get size() {
        return this.players.length;
    }
    /** 组中玩家数量(不包含下线玩家) */
    get validSize() {
        return this.players.filter((p) => p.isValid).length;
    }
    /** 根据 id 查找玩家 */
    getById(id) {
        return this.players.find((p) => p.id == id);
    }
    /** 是否包含玩家 */
    has(player) {
        return this.players.findIndex((p) => p.id == player.id) != -1;
    }
    add(player) {
        if (!(player instanceof this.playerConstructor)) {
            throw new PlayerGroupError(`添加的player必须是${this.playerConstructor.name}`);
        }
        if (!this.has(player)) {
            this.players.push(player);
        }
        return this;
    }
    delete(player) {
        const index = this.players.findIndex((p) => p.id == player.id);
        if (index != -1) {
            this.players.splice(index, 1);
        }
        return this;
    }
    removeWhere(func) {
        const removed = [];
        this.players = this.players.filter((p) => {
            if (func(p)) {
                removed.push(p);
                return false;
            }
            return true;
        });
        return removed;
    }
    /**获取组中全部玩家的拷贝 */
    getAll() {
        return this.players.slice();
    }
    /** 获取所有原生 Player 对象 */
    getAllPlayers() {
        return this.players.map((p) => p.player).filter((p) => p != undefined);
    }
    /**对所有有效玩家执行操作 */
    forEach(func) {
        try {
            this.players.filter((p) => p.isValid).forEach(func);
        }
        catch (err) {
            console.error(err, err instanceof Error ? err.stack : "");
        }
    }
    /**组内所有玩家执行命令 */
    runCommand(commandString) {
        this.forEach((p) => p.runCommand(commandString));
        return this;
    }
    /**向组内所有玩家发送消息 */
    sendMessage(mes) {
        this.forEach((p) => p.sendMessage(mes));
        return this;
    }
    /**向组内所有玩家显示标题 */
    title(title, subtitle, options) {
        this.forEach((p) => p.title(title, subtitle, options));
        return this;
    }
    actionbar(text) {
        this.forEach((p) => p.actionbar(text));
        return this;
    }
    /**向组内所有玩家播放音效 */
    playSound(soundId, soundOptions) {
        this.forEach((p) => p.player?.playSound(soundId, soundOptions));
        return this;
    }
    map(func) {
        return this.players.map(func);
    }
    /**获取随机在线玩家 */
    random() {
        const validPlayers = this.players.filter((p) => p.isValid);
        if (validPlayers.length === 0)
            return undefined;
        const index = Math.floor(Math.random() * validPlayers.length);
        return validPlayers[index];
    }
    filter(func) {
        return this.players.filter(func);
    }
    /** 清空组 */
    clear() {
        this.players = [];
        return this;
    }
    /**清除无效玩家 */
    clearInvalid() {
        this.players = this.players.filter((p) => p.isValid);
        return this;
    }
    /** 克隆一份新的 PlayerGroup */
    clone() {
        return new PlayerGroup(this.playerConstructor, this.players);
    }
    /** 查找符合条件的玩家 */
    find(predicate) {
        return this.players.find(predicate);
    }
    findIndex(predicate) {
        return this.players.findIndex(predicate);
    }
}
