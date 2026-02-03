import { Player, PlayerSoundOptions, RawMessage, TitleDisplayOptions } from "@minecraft/server";
import { GamePlayer, GamePlayerConstructor, ValidGamePlayer } from "./gamePlayer.js";
/**玩家组 */
export declare class PlayerGroup<T extends GamePlayer = GamePlayer, TData = undefined> {
    private players;
    readonly playerConstructor: GamePlayerConstructor<T>;
    readonly data: TData;
    /**创建新的玩家组 */
    constructor(playerClass: GamePlayerConstructor<T>, players?: T[]);
    constructor(playerClass: GamePlayerConstructor<T>, players: T[], data?: TData);
    /** 组中玩家数量(包含下线玩家) */
    get size(): number;
    /** 组中玩家数量(不包含下线玩家) */
    get validSize(): number;
    /** 根据 id 查找玩家 */
    getById(id: string): T | undefined;
    /** 是否包含玩家 */
    has(player: T | Player): boolean;
    add(player: T): this;
    delete(player: T | Player): this;
    removeWhere(func: (player: T) => boolean): T[];
    /**获取组中全部玩家的拷贝 */
    getAll(): T[];
    /** 获取所有原生 Player 对象 */
    getAllPlayers(): Player[];
    /**对所有有效玩家执行操作 */
    forEach(func: (p: ValidGamePlayer<T>) => void): void;
    /**组内所有玩家执行命令 */
    runCommand(commandString: string): this;
    /**向组内所有玩家发送消息 */
    sendMessage(mes: string | RawMessage | (string | RawMessage)[]): this;
    /**向组内所有玩家显示标题 */
    title(title: string | RawMessage | (string | RawMessage)[], subtitle?: string | RawMessage | (string | RawMessage)[], options?: TitleDisplayOptions): this;
    actionbar(text: (RawMessage | string)[] | RawMessage | string): this;
    /**向组内所有玩家播放音效 */
    playSound(soundId: string, soundOptions?: PlayerSoundOptions | undefined): this;
    map<U>(func: (p: T) => U): U[];
    /**获取随机在线玩家 */
    random(): T | undefined;
    filter(func: (p: T) => boolean): T[];
    /** 清空组 */
    clear(): this;
    /**清除无效玩家 */
    clearInvalid(): this;
    /** 克隆一份新的 PlayerGroup */
    clone(): PlayerGroup<T>;
    /** 查找符合条件的玩家 */
    find(predicate: (p: T) => boolean): T | undefined;
    findIndex(predicate: (p: T) => boolean): number;
}
