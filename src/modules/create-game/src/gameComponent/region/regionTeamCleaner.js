import { RegionEventType } from "../../gameEvent/events/regionEvents.js";
import { Game } from "../../main.js";
import { GameComponent } from "../gameComponent.js";
/**玩家离开指定区域时将他从team移除 */
export class RegionTeamCleaner extends GameComponent {
    onAttach() {
        if (!this.options)
            return;
        this.subscribe(Game.events.region, (t) => {
            if (t.type == RegionEventType.Leave) {
                this.options?.teams.forEach((team) => team.delete(t.player));
                this.options?.onClean?.(t.player);
            }
        }, this.options.region);
    }
}
