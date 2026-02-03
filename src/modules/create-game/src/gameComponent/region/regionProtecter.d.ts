import { PlayerGroupSet } from "../../gamePlayer/index.js";
import { GameRegion } from "../../gameRegion/gameRegion.js";
import { GameState } from "../../gameState/index.js";
import { GameComponent } from "../gameComponent.js";
export interface RegionProtectionOptions {
    /** 需要保护的区域 */
    region: GameRegion;
    /** 是否阻止区域内方块被破坏 */
    blockBreakInside?: boolean;
    /** 是否阻止区域内方块被交互 */
    blockInteractInside?: boolean;
    /** 是否阻止区域外方块被破坏 */
    blockBreakOutside?: boolean;
    /** 是否阻止区域外方块被交互 */
    blockInteractOutside?: boolean;
    /** 生效的玩家组集合 */
    groupSet?: PlayerGroupSet<any>;
}
export declare class RegionProtector extends GameComponent<GameState, RegionProtectionOptions> {
    protected onAttach(): void;
    private handleBreak;
    private handleInteract;
}
