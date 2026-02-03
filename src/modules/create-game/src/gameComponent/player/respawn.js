import { world } from "@minecraft/server";
import { EntityTypeIds } from "../../utils/vanila-data.js";
import { GameComponent } from "../index.js";
export class RespawnComponent extends GameComponent {
    onAttach() {
        if (!this.options)
            return;
        const { onDie, autoBroadcast, buildNameFunc, groupSet, onSpawn, buildMsg, } = this.options;
        this.subscribe(world.afterEvents.entityDie, (event) => {
            const deadEntity = event.deadEntity;
            if (deadEntity.typeId !== EntityTypeIds.Player)
                return;
            const result = groupSet.findById(deadEntity.id);
            if (!result)
                return;
            const { player, group } = result;
            // 执行自定义逻辑
            onDie?.(player, group, event.damageSource.damagingEntity);
            // 自动广播消息
            if (autoBroadcast && buildNameFunc) {
                const playerName = buildNameFunc(player, group);
                const killerName = this.getKillerName(event.damageSource.damagingEntity);
                let message;
                if (buildMsg) {
                    message = buildMsg(playerName, killerName, player);
                }
                else {
                    message = killerName
                        ? `${playerName} §r 被 ${killerName} §r 杀死了`
                        : `${playerName} §r 死了`;
                }
                groupSet.sendMessage(message);
            }
        });
        if (onSpawn) {
            this.subscribe(world.afterEvents.playerSpawn, (t) => {
                const ans = groupSet.findById(t.player.id);
                if (ans?.player) {
                    onSpawn(ans.player, ans.group);
                }
            });
        }
    }
    getKillerName(source) {
        if (!source || source.typeId !== EntityTypeIds.Player)
            return undefined;
        const result = this.options.groupSet.findById(source.id);
        if (!result)
            return undefined;
        if (this.options.buildNameFunc) {
            return this.options.buildNameFunc(result.player, result.group);
        }
        return undefined;
    }
}
