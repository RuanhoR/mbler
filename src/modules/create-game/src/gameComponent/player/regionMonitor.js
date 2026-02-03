import { Game } from "../../main.js";
import { GameComponent } from "../gameComponent.js";
/**玩家区域监测 */
export class PlayerRegionMonitor extends GameComponent {
    onAttach() {
        if (!this.options)
            return;
        this.subscribe(Game.events.interval, () => this.detectOutOfRegionPlayers(), this.options.interval);
    }
    detectOutOfRegionPlayers() {
        const region = this.options.region;
        this.options.groups.forEach((p) => {
            if (!region.isInside(p.player.location)) {
                this.options.onLeave(p);
            }
        });
    }
}
