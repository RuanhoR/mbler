import { BlockComponentTypes } from "@minecraft/server";
import { PlayerGroupSet } from "../../gamePlayer/groupSet.js";
import { GameComponent, GameState } from "../../main.js";
export interface InteractionBlockerOptions {
    /** 被限制的玩家组 */
    groupSet: PlayerGroupSet;
    /**
     * 可选：指定要阻止交互的方块 ID 列表。
     * 若不设置或为空，则表示不按 ID 限制。
     */
    blockIds?: string[];
    /**
     * 可选：指定要阻止的方块组件类型（例如 BlockComponentTypes.Inventory）。
     * 若不设置，则不按组件过滤。
     */
    blockComponentType?: BlockComponentTypes;
    /**
     * 可选：是否给玩家提示（默认 true）
     */
    showMessage?: boolean;
    /**
     * 可选：提示信息
     */
    message?: string;
}
/**
 * 通用方块交互阻止组件
 */
export declare class BlockInteractionBlocker extends GameComponent<GameState, InteractionBlockerOptions> {
    onAttach(): void;
}
