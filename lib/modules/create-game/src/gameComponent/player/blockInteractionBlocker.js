import { system, world } from "@minecraft/server";
import { GameComponent } from "../../main.js";
/**
 * 通用方块交互阻止组件
 */
export class BlockInteractionBlocker extends GameComponent {
    onAttach() {
        if (!this.options)
            return;
        const { groupSet, blockIds, blockComponentType, showMessage = true, message, } = this.options;
        this.subscribe(world.beforeEvents.playerInteractWithBlock, (t) => {
            const { player, block } = t;
            // 1️⃣ 不在限制组内 -> 放行
            if (!groupSet.findById(player.id))
                return;
            // 2️⃣ 若设置 blockIds，则仅匹配这些方块
            if (blockIds &&
                blockIds.length > 0 &&
                !blockIds.includes(block.typeId)) {
                return;
            }
            // 3️⃣ 若设置 blockComponentType，则仅匹配拥有该组件的方块
            if (blockComponentType) {
                const comp = block.getComponent(blockComponentType);
                if (!comp)
                    return; // 若该方块没有该组件 -> 放行
            }
            // 4️⃣ 阻止交互
            t.cancel = true;
            // 5️⃣ 提示
            if (showMessage) {
                system.run(() => player.onScreenDisplay.setActionBar(message ?? "§c你无法与该方块交互！"));
            }
        });
    }
}
