import { DisplaySlotId, system, world, } from "@minecraft/server";
import { GameComponent } from "../gameComponent.js";
export class TeamScoreBoard extends GameComponent {
    obj;
    lastRefresh = 0;
    onAttach() {
        if (!this.options)
            return;
        this.reset();
    }
    getObj() {
        if (this.obj && this.obj.isValid)
            return this.obj;
        this.obj =
            world.scoreboard.getObjective(this.options.scoreboardName) ??
                world.scoreboard.addObjective(this.options.scoreboardName, this.options.displayName);
        return this.obj;
    }
    reset() {
        const obj = this.getObj();
        const isDisplay = world.scoreboard.getObjectiveAtDisplaySlot(DisplaySlotId.Sidebar)
            ?.objective.id == obj.id;
        world.scoreboard.removeObjective(obj);
        if (isDisplay) {
            this.show();
        }
    }
    /**显示 */
    show() {
        if (!this.options)
            return;
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
            objective: this.getObj(),
        });
    }
    /**刷新选队计分板 */
    refreshScoreBoard() {
        if (!this.options)
            return;
        if (this.lastRefresh == system.currentTick)
            return;
        //清空计分板
        this.reset();
        //构建计分项
        const scores = [];
        const teams = this.options.teams;
        for (const team of teams) {
            let sortedTeam = team.team.getAll();
            //过滤
            if (team.teamFilter) {
                sortedTeam = sortedTeam.filter(team.teamFilter);
            }
            //排序
            if (team.teamSort) {
                sortedTeam.sort(team.teamSort);
            }
            sortedTeam.forEach((p) => {
                if (!(team.showInvalid ?? false) && !p.isValid) {
                    return;
                }
                const text = team.buildName
                    ? team.buildName(p)
                    : (team.prefix ?? "") + p.name;
                scores.push(text);
            });
        }
        //设置积分项
        const obj = this.getObj();
        for (let i = 0; i < scores.length; i++) {
            obj.setScore(scores[i], i);
        }
        this.lastRefresh = system.currentTick;
    }
    onDetach() {
        if (this.obj?.isValid) {
            world.scoreboard.removeObjective(this.obj);
        }
    }
}
