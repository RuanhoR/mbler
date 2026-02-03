import { EntityComponentTypes, } from "@minecraft/server";
/**游戏玩家基类 */
export class GamePlayer {
    _player;
    id;
    name;
    /**是否仍然在当前游戏（调用/hub等会为false） */
    isActive = true;
    constructor(player) {
        this._player = player;
        this.id = player.id;
        this.name = player.name;
    }
    get isValid() {
        return this._player.isValid && this.isActive;
    }
    /**获取player
     * 若玩家下线或失效返回undefined
     */
    get player() {
        if (this.isValid) {
            return this._player;
        }
    }
    /**发送消息 */
    sendMessage(mes) {
        if (!this.isValid)
            return;
        this._player.sendMessage(mes);
    }
    /**运行命令 */
    runCommand(cmd) {
        if (!this.isValid)
            return;
        return this._player.runCommand(cmd);
    }
    /**给物品 */
    giveItem(item) {
        if (!this.isValid)
            return;
        const container = this._player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!container)
            return;
        container.addItem(item);
    }
    /**清除(使用命令)*/
    clear(itemId) {
        this.runCommand("clear @s " + (itemId ?? ""));
    }
    /**展示title */
    title(title, subtitle, options) {
        if (!this.isValid)
            return;
        this._player.onScreenDisplay.setTitle(title, {
            subtitle: subtitle,
            fadeInDuration: 10,
            stayDuration: 70,
            fadeOutDuration: 20,
            ...options,
        });
    }
    /**设置actionbar文字 */
    actionbar(text) {
        if (!this.isValid)
            return;
        this._player.onScreenDisplay.setActionBar(text);
    }
    /**
     * 为玩家添加效果
     * @param showParticles 是否显示粒子，默认为false
     */
    addEffect(effectType, duration, amplifier, showParticles) {
        if (!this.isValid)
            return;
        this._player.addEffect(effectType, duration, {
            amplifier: amplifier ?? 1,
            showParticles: showParticles ?? false,
        });
    }
}
/**带寿命的player */
export class TTLPlayer extends GamePlayer {
    /**初始TTL，可override */
    initialTTL = 30;
    _ttl = this.initialTTL;
    /**剩余寿命(自动处理isActive) */
    set ttl(value) {
        this._ttl = this.isActive ? value : 0; //如果isActive已经为false，则ttl直接归零
    }
    /**获取玩家剩余存活时间 */
    get ttl() {
        return this._ttl;
    }
    get isValid() {
        return super.isValid && this.ttl > 0;
    }
}
