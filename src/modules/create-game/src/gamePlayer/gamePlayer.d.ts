import { EffectType, ItemStack, Player, RawMessage, TitleDisplayOptions } from "@minecraft/server";
/**游戏玩家基类 */
export declare class GamePlayer {
    private readonly _player;
    readonly id: string;
    readonly name: string;
    /**是否仍然在当前游戏（调用/hub等会为false） */
    protected isActive: boolean;
    constructor(player: Player);
    get isValid(): Readonly<boolean>;
    /**获取player
     * 若玩家下线或失效返回undefined
     */
    get player(): Player | undefined;
    /**发送消息 */
    sendMessage(mes: (RawMessage | string)[] | RawMessage | string): void;
    /**运行命令 */
    runCommand(cmd: string): import("@minecraft/server").CommandResult | undefined;
    /**给物品 */
    giveItem(item: ItemStack): void;
    /**清除(使用命令)*/
    clear(itemId?: string): void;
    /**展示title */
    title(title: string | RawMessage | (string | RawMessage)[], subtitle?: string | RawMessage | (string | RawMessage)[], options?: TitleDisplayOptions): void;
    /**设置actionbar文字 */
    actionbar(text: (RawMessage | string)[] | RawMessage | string): void;
    /**
     * 为玩家添加效果
     * @param showParticles 是否显示粒子，默认为false
     */
    addEffect(effectType: string | EffectType, duration: number, amplifier?: number, showParticles?: boolean): void;
}
/**带寿命的player */
export declare class TTLPlayer extends GamePlayer {
    /**初始TTL，可override */
    readonly initialTTL: number;
    private _ttl;
    /**剩余寿命(自动处理isActive) */
    set ttl(value: number);
    /**获取玩家剩余存活时间 */
    get ttl(): number;
    get isValid(): Readonly<boolean>;
}
export type ValidGamePlayer<T extends GamePlayer> = T & {
    player: Player;
};
export type GamePlayerConstructor<T extends GamePlayer = GamePlayer> = new (p: Player) => T;
