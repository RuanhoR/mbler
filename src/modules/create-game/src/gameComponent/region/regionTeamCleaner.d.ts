import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { GameRegion } from "../../gameRegion/gameRegion.js";
import { GameState } from "../../gameState/gameState.js";
import { GameComponent } from "../gameComponent.js";
import { Player } from "@minecraft/server";
export interface RegionTeamCleanUpOptions {
    region: GameRegion;
    teams: PlayerGroup<any>[];
    onClean?: (p: Player) => void;
}
/**玩家离开指定区域时将他从team移除 */
export declare class RegionTeamCleaner extends GameComponent<GameState, RegionTeamCleanUpOptions> {
    onAttach(): void;
}
