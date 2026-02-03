import { GamePlayer, PlayerGroup } from "../../gamePlayer/index.js";
import { GameState } from "../../gameState/index.js";
import { GameComponent } from "../gameComponent.js";
export interface TeamScoreBoardTeamData<T extends GamePlayer = GamePlayer> {
    /**队伍对象 */
    team: PlayerGroup<T>;
    /**前缀 */
    prefix?: string;
    /**自定义方法，会覆盖前缀 */
    buildName?: (player: T) => string;
    /**同组排序方法 */
    teamSort?: (p1: T, p2: T) => number;
    /**组内过滤 */
    teamFilter?: (p: T) => boolean;
    /** 展示失效玩家(默认否)*/
    showInvalid?: boolean;
}
export interface TeamScoreBoardOptions<P extends GamePlayer> {
    /**计分板名 */
    scoreboardName: string;
    /**计分板显示名 */
    displayName: string;
    /**传入队伍数组 */
    teams: TeamScoreBoardTeamData<P>[];
}
export declare class TeamScoreBoard<P extends GamePlayer> extends GameComponent<GameState<P>, TeamScoreBoardOptions<P>> {
    private obj?;
    private lastRefresh;
    onAttach(): void;
    private getObj;
    private reset;
    /**显示 */
    show(): void;
    /**刷新选队计分板 */
    refreshScoreBoard(): void;
    onDetach(): void;
}
