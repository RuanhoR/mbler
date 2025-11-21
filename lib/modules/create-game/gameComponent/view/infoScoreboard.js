import { DisplaySlotId, world } from "@minecraft/server";
import { GameComponent } from "../gameComponent";
/**信息侧边栏 */
export class InfoScoreboard extends GameComponent {
    objective;
    initCode = 48;
    getObj() {
        if (this.objective && this.objective.isValid)
            return this.objective;
        const name = this.options.scoreBoardName;
        this.objective =
            world.scoreboard.getObjective(name) ??
                world.scoreboard.addObjective(name, this.options.displayName);
        return this.objective;
    }
    onAttach() {
        if (!this.options) {
            throw new Error("无options");
        }
        if (this.options.showOnAttach) {
            this.show();
        }
    }
    onDetach() {
        if (this.objective?.isValid) {
            world.scoreboard.removeObjective(this.objective);
        }
    }
    /**手动显示计分板 */
    show() {
        if (!this.options)
            return;
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
            objective: this.getObj(),
        });
    }
    /**更新计分板内容 */
    updateLines(lines) {
        if (!this.options)
            return;
        const sb = this.getObj();
        const isDisplay = world.scoreboard.getObjectiveAtDisplaySlot(DisplaySlotId.Sidebar)
            ?.objective.id == sb.id;
        world.scoreboard.removeObjective(sb);
        //如果不在显示则直接返回
        if (!isDisplay) {
            return;
        }
        this.show();
        //预处理
        let blankCode = this.initCode;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") {
                lines[i] = "§" + String.fromCodePoint(blankCode++);
            }
            lines[i] = " ".repeat(this.options.paddingLeft ?? 0) + lines[i];
        }
        //加上header和footer
        const header = this.options?.header;
        const footer = this.options?.footer;
        if (header) {
            lines.unshift(...header());
        }
        if (footer) {
            lines.push(...footer());
        }
        const sb1 = this.getObj();
        //设置
        for (let i = 0; i < lines.length; i++) {
            sb1.setScore(lines[i], lines.length - i - 1);
        }
    }
}
