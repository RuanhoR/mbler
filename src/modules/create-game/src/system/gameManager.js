import { Game } from "../main.js";
import { SAPIGameConfig } from "../config.js";
import { GameManagerError } from "../utils/GameError.js";
import { Logger } from "../utils/logger.js";
export class GameManager {
    games = new Map();
    logger = new Logger(this.constructor.name);
    addGame(map, key, gameInstance) {
        if (map.has(key)) {
            throw new GameManagerError(`已存在游戏: ${key}`);
        }
        this.logger.log(`startedGame: ${key}`);
        gameInstance.onStart();
        map.set(key, gameInstance);
    }
    /**
     * 启动指定游戏
     * @throws GameManagerError 当游戏已存在时
     */
    startGame(game, config, tag) {
        const key = this.buildKey(game, tag);
        const gameInstance = new game(key, config);
        this.addGame(this.games, key, gameInstance);
    }
    /**获取指定tag游戏是否已存在 */
    hasGame(game, tag) {
        const key = this.buildKey(game, tag);
        const gameInstance = this.games.get(key);
        return gameInstance != undefined;
    }
    /**获取game */
    getGame(game, tag) {
        return this.games.get(this.buildKey(game, tag));
    }
    getGameByKey(key) {
        const game = this.games.get(key);
        return game;
    }
    stopGame(game, tag) {
        const key = this.buildKey(game, tag);
        this.stopGameByKey(key);
    }
    stopGameByKey(key) {
        const gameInstance = this.games.get(key);
        if (gameInstance) {
            gameInstance.onStop();
            gameInstance.onDispose();
            this.games.delete(key);
            this.logger.log(`stopedGame: ${key}`);
        }
        else {
            this.logger.error("StopGame失败，游戏不存在:" + key);
        }
    }
    /**停止所有普通游戏 */
    stopAll() {
        for (const [key, game] of this.games) {
            if (game.isDaemon)
                continue;
            const instance = game;
            instance.onStop();
            instance.onDispose();
            this.logger.log(`stopedGame: ${key}`);
            this.games.delete(key);
        }
    }
    /**静默停止所有普通游戏 */
    end() {
        for (const [key, game] of this.games) {
            if (game.isDaemon)
                continue;
            game.onDispose();
            this.logger.log(`endedGame: ${key}`);
            this.games.delete(key);
        }
        SAPIGameConfig.config.onEnd();
    }
    status(player, detail) {
        const lines = [];
        // 顶部标题
        lines.push("§6========== 游戏状态 ==========");
        lines.push(`§e总游戏数: §a${this.games.size}`);
        lines.push("§6================================");
        lines.push("");
        lines.push("玩家状态");
        lines.push(Game.playerManager.status());
        lines.push("");
        // 常驻游戏
        if (this.games.size) {
            lines.push("§d—— 常驻游戏 ——");
            for (const [key, g] of this.games) {
                if (g.isDaemon) {
                    lines.push(`§a● ${key} §7|\ §f${g.stats(detail)}`);
                }
            }
            lines.push("");
        }
        // 普通游戏
        if (this.games.size) {
            lines.push("§d—— 普通游戏 ——");
            for (const [key, g] of this.games) {
                if (!g.isDaemon) {
                    lines.push(`§a● ${key} §7|\ §f${g.stats(detail)}`);
                }
            }
            lines.push("");
        }
        // 汇总输出
        const message = lines.join("\n");
        if (player) {
            player.sendMessage(message);
        }
        else {
            console.log(message);
        }
    }
    buildKey(game, tag) {
        return `${game.name}:${tag ?? 0}`;
    }
}
