import { DisplaySlotId, EntityComponentTypes, world, } from "@minecraft/server";
import { Game } from "../../main.js";
import { GameComponent } from "../index.js";
export class PlayerHealthIndicator extends GameComponent {
    obj;
    onAttach() {
        if (!this.options)
            return;
        this.subscribe(Game.events.interval, () => this.refresh(), this.options.refreshInterval);
    }
    onDetach() {
        if (this.obj?.isValid) {
            world.scoreboard.removeObjective(this.obj);
        }
    }
    getObj() {
        if (this.obj && this.obj.isValid)
            return this.obj;
        this.obj =
            world.scoreboard.getObjective(this.options.scoreBoardName) ??
                world.scoreboard.addObjective(this.options.scoreBoardName, this.options.displayName);
        return this.obj;
    }
    /**展示 */
    show() {
        const obj = this.getObj();
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.BelowName, {
            objective: obj,
        });
    }
    /**刷新计分板 */
    refresh() {
        const obj = this.getObj();
        world.getAllPlayers().forEach((p) => {
            if (!p)
                return;
            const comp = p.getComponent(EntityComponentTypes.Health);
            if (!comp)
                return;
            const cur = comp.currentValue;
            obj.setScore(p, cur);
        });
    }
}
