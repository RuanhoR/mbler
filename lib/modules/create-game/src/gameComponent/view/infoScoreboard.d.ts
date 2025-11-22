import { GameState } from "../../gameState/gameState.js";
import { GameComponent } from "../gameComponent.js";
export interface infoScoreboardOptions {
    /**计分板名 */
    scoreBoardName: string;
    /**计分板显示名字 */
    displayName: string;
    /**内容的左侧边距 */
    paddingLeft?: number;
    /**头部 */
    header?: () => string[];
    /**底部 */
    footer?: () => string[];
    /**是否立即显示计分板 */
    showOnAttach: boolean;
}
/**信息侧边栏 */
export declare class InfoScoreboard extends GameComponent<GameState, infoScoreboardOptions> {
    private objective;
    private initCode;
    private getObj;
    onAttach(): void;
    onDetach(): void;
    /**手动显示计分板 */
    show(): void;
    /**更新计分板内容 */
    updateLines(lines: string[]): void;
}
