import { GamePlayer, PlayerGroupSet } from "../../gamePlayer/index.js";
import { GameRegion } from "../../gameRegion/gameRegion.js";
import { GameState } from "../../gameState/index.js";
import { Duration } from "../../utils/index.js";
import { GameComponent } from "../gameComponent.js";
export interface PlayerRegionMonitorOptions<P extends GamePlayer> {
    /**区域 */
    region: GameRegion;
    /**检测间隔 */
    interval: Duration;
    /**玩家组集合 */
    groups: PlayerGroupSet<P>;
    /**区域外的玩家执行 */
    onLeave: (player: P) => void;
}
/**玩家区域监测 */
export declare class PlayerRegionMonitor<P extends GamePlayer> extends GameComponent<GameState, PlayerRegionMonitorOptions<P>> {
    onAttach(): void;
    private detectOutOfRegionPlayers;
}
