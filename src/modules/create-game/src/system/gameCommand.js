import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player, system, } from "@minecraft/server";
import { Game } from "../main.js";
import { EntityTypeIds } from "../utils/vanila-data.js";
import { SAPIGameConfig } from "../config.js";
export function regGameCommand(customCommandRegistry) {
    //注册枚举
    customCommandRegistry.registerEnum("game:opreation", [
        "start",
        "stop",
        "stopAll",
        "status",
        "end",
    ]);
    //注册命令
    customCommandRegistry.registerCommand({
        name: "game:game",
        description: "SAPI-Game命令操作",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            {
                name: "game:opreation",
                type: CustomCommandParamType.Enum,
            },
        ],
        optionalParameters: [
            { name: "gameName", type: CustomCommandParamType.String },
            { name: "gameTag", type: CustomCommandParamType.String },
        ],
    }, (origin, ope, name, tag) => {
        return handleCommand(origin, ope, name, tag);
    });
    customCommandRegistry.registerCommand({
        name: "game:hub",
        description: "SAPI-Game返回主城命令",
        permissionLevel: CommandPermissionLevel.Any,
    }, (origin) => {
        if (origin.sourceEntity?.typeId != EntityTypeIds.Player)
            return {
                message: "必须是玩家执行",
                status: CustomCommandStatus.Failure,
            };
        Game.playerManager.forceReleaseFromGame(origin.sourceEntity.id);
        system.run(() => {
            SAPIGameConfig.config.hub(origin.sourceEntity);
        });
        return { message: "", status: CustomCommandStatus.Success };
    });
    customCommandRegistry.registerCommand({
        name: "game:l",
        description: "SAPI-Game返回主城命令",
        permissionLevel: CommandPermissionLevel.Any,
    }, (origin) => {
        if (origin.sourceEntity?.typeId != EntityTypeIds.Player)
            return {
                message: "必须是玩家执行",
                status: CustomCommandStatus.Failure,
            };
        Game.playerManager.forceReleaseFromGame(origin.sourceEntity.id);
        system.run(() => {
            SAPIGameConfig.config.hub(origin.sourceEntity);
        });
        return { message: "", status: CustomCommandStatus.Success };
    });
}
function handleCommand(origin, ope, name, tag) {
    const player = origin.sourceEntity instanceof Player ? origin.sourceEntity : undefined;
    switch (ope) {
        case "stopAll":
            system.run(() => {
                Game.manager.stopAll();
            });
            return {
                message: "已停止所有运行中的游戏",
                status: CustomCommandStatus.Success,
            };
        case "status":
            Game.manager.status(player, name === "detail");
            break;
        case "stop":
            if (name) {
                const key = `${name}:${tag ?? 0}`;
                const engine = Game.manager.getGameByKey(key);
                if (!engine)
                    return {
                        message: "游戏不存在",
                        status: CustomCommandStatus.Failure,
                    };
                system.run(() => {
                    Game.manager.stopGameByKey(key);
                });
                return {
                    message: `已停止游戏: ${key}`,
                    status: CustomCommandStatus.Success,
                };
            }
            break;
        case "end":
            system.run(() => {
                Game.manager.end();
            });
            break;
    }
    return undefined;
}
