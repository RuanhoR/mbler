import { system, world } from "@minecraft/server";
import { GameComponent } from "../../main.js";
/**
 * 通用实体交互阻止组件
 */
export class EntityInteractionBlocker extends GameComponent {
    onAttach() {
        if (!this.options)
            return;
        const { groupSet, entityIds, entityComponentTypes, showMessage = true, message, } = this.options;
        this.subscribe(world.beforeEvents.playerInteractWithEntity, (t) => {
            const { player, target } = t;
            console.log(target.typeId);
            // 1️⃣ 不在限制组内 -> 放行
            if (!groupSet.findById(player.id))
                return;
            // 2️⃣ 若有实体类型限制，且当前实体不在其中 -> 放行
            if (entityIds &&
                entityIds.length > 0 &&
                !entityIds.includes(target.typeId)) {
                return;
            }
            // 3️⃣ 若指定组件类型数组，且实体不含任意一个组件 -> 放行
            if (entityComponentTypes && entityComponentTypes.length > 0) {
                const hasComponent = entityComponentTypes.some((type) => {
                    try {
                        return !!target.getComponent(type);
                    }
                    catch {
                        return false;
                    }
                });
                if (!hasComponent)
                    return;
            }
            // 4️⃣ 阻止交互
            t.cancel = true;
            // 5️⃣ 提示
            if (showMessage) {
                system.run(() => player.onScreenDisplay.setActionBar(message ?? "§c你无法与该实体交互！"));
            }
        });
    }
}
