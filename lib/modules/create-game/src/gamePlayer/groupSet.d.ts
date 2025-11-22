import { RawMessage, TitleDisplayOptions } from "@minecraft/server";
import { GamePlayer, ValidGamePlayer } from "./gamePlayer.js";
import { PlayerGroup } from "./playerGroup.js";
/**玩家组集合 */
export declare class PlayerGroupSet<T extends GamePlayer = GamePlayer, TData = any> {
    private groups;
    constructor(groups?: PlayerGroup<T, TData>[]);
    addGroup(group: PlayerGroup<T, TData>): this;
    removeGroup(group: PlayerGroup<T, TData>): this;
    getGroups(): readonly PlayerGroup<T, TData>[];
    /**获取所有玩家，包括invalid的 */
    getAllPlayers(): T[];
    /**获取所有有效玩家 */
    getAllValidPlayers(): ValidGamePlayer<T>[];
    /**对所有有效玩家执行操作*/
    forEach(func: (p: ValidGamePlayer<T>) => void): this;
    forEachGroup(func: (g: PlayerGroup<T, TData>) => void): void;
    /**让所有玩家执行命令 */
    runCommand(command: string): this;
    runCommands(commands: string[]): void;
    /**向所有玩家发送消息 */
    sendMessage(mes: string | RawMessage | (string | RawMessage)[]): this;
    /**对所有玩家显示标题 */
    title(title: string | RawMessage | (string | RawMessage)[], subtitle?: string | RawMessage | (string | RawMessage)[], options?: TitleDisplayOptions): this;
    filter(predicate: (p: T) => boolean): T[];
    clear(): this;
    clearInvalid(): void;
    clone(): PlayerGroupSet<T>;
    get size(): number;
    get validSize(): number;
    /** 根据玩家 ID 查找玩家及其所在组 */
    findById(id: string): {
        player: T;
        group: PlayerGroup<T, TData>;
    } | undefined;
    /**判断玩家是否在内 */
    has(id: string): boolean;
}
