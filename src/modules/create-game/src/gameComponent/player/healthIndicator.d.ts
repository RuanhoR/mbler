import { GameState } from "../../gameState/index.js";
import { Duration } from "../../utils/index.js";
import { GameComponent } from "../index.js";
export interface PlayerHealthIndicatorOptions {
    /**计分板名 */
    scoreBoardName: string;
    /**显示名称 */
    displayName: string;
    /**刷新间隔 */
    refreshInterval: Duration;
}
export declare class PlayerHealthIndicator extends GameComponent<GameState, PlayerHealthIndicatorOptions> {
    private obj?;
    onAttach(): void;
    onDetach(): void;
    private getObj;
    /**展示 */
    show(): void;
    /**刷新计分板 */
    refresh(): void;
}
