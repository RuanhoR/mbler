import { GamePlayer } from "../../gamePlayer/gamePlayer.js";
import { PlayerGroup } from "../../gamePlayer/playerGroup.js";
import { GameRegion } from "../../gameRegion/gameRegion.js";
import { GameState } from "../../gameState/gameState.js";
import { GameComponent } from "../gameComponent.js";
export interface RegionTeamChooserData<P extends GamePlayer> {
    /**指定范围 */
    region: GameRegion;
    /**玩家进入区域时执行 */
    onEnter?: (player: P) => void;
    /**玩家首次加入本队时执行 */
    onJoin?: (player: P) => void;
    /**指定队伍*/
    team: PlayerGroup<P>;
}
interface RegionTeamChooserConfig<P extends GamePlayer> {
    config: RegionTeamChooserData<P>[];
    /**当玩家离开区域时是否从队伍中删除(默认否) */
    removeOnLeave?: boolean;
    /**是否允许旁观者进队(默认否) */
    allowSpectator?: boolean;
}
/**区域队伍选择器 */
export declare class RegionTeamChooser<P extends GamePlayer, S extends GameState<P, any> = GameState<P, any>> extends GameComponent<S, RegionTeamChooserConfig<P>> {
    onAttach(): void;
    private handleRegionEvent;
    private handlePlayerEnter;
    private handlePlayerLeave;
    onDetach(): void;
}
export {};
