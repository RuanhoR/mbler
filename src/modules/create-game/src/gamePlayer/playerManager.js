import { Game } from "../main.js";
import { PlayerGroupBuilder } from "./groupBuilder.js";
/**游戏玩家管理器 */
export class GamePlayerManager {
    gameKey;
    isDaemon;
    players = new Map();
    playerConstructor;
    /**玩家组构建器 */
    groupBuilder;
    constructor(playerConstructor, gameKey, isDaemon) {
        this.gameKey = gameKey;
        this.isDaemon = isDaemon;
        this.playerConstructor = playerConstructor;
        this.groupBuilder = new PlayerGroupBuilder(this);
    }
    /**获取游戏玩家(若玩家已分配，返回无效玩家) */
    get(p) {
        //创建
        let gamePlayer = this.players.get(p.id);
        //若未创建或已失效，则重新创建并尝试分配
        if (!gamePlayer || !gamePlayer.isActive) {
            gamePlayer = new this.playerConstructor(p);
            this.players.set(p.id, gamePlayer);
            //申请分配玩家
            if (!this.isDaemon) {
                const ans = Game.playerManager.allocatePlayerToGame(p.id, this.gameKey);
                gamePlayer.isActive = ans;
            }
        }
        return gamePlayer;
    }
    getAll() {
        return Array.from(this.players.values());
    }
    /**让玩家失活 */
    deactivate(p) {
        let gamePlayer = this.players.get(p.id);
        if (gamePlayer) {
            gamePlayer.isActive = false; //强制修改活动状态
        }
    }
    get size() {
        return this.players.size;
    }
    get validSize() {
        return Array.from(this.players.values()).filter((p) => p.isValid)
            .length;
    }
    dispose() {
        Game.playerManager.releaseAllPlayerFromGame(this.gameKey);
    }
}
