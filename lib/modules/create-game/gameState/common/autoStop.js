import {
  Game,
  GameState
} from "./../../main";
import {
  Duration
} from "./../../utils";
/**自动在groupSet所有玩家寄了之后停止游戏 */
export class AutoStopState extends GameState {
  onEnter() {
    if (!this.config?.groupSet)
      return;
    this.subscribe(Game.events.interval, this.tick.bind(this), new Duration(20));
  }
  tick() {
    let liveSize = 0;
    this.config.groupSet.getAllPlayers().forEach((p) => {
      if (p.ttl > 0)
        liveSize++;
      if (p.isValid) {
        p.ttl = p.initialTTL; //重置TTL
      } else if (p.ttl > 0) {
        p.ttl--; //下线的ttl减少
        if (this.config?.immediateDie)
          p.ttl = 0;
        if (p.ttl == 0) {
          this.config.onLeave?.(p);
          //自动释放玩家
          if (this.config?.shouldRelease ?? true)
            Game.playerManager.releasePlayerFromGame(p.id, this.engine.key);
        }
      }
    });
    if (liveSize === 0) {
      this.logger.debug("检测到玩家已全部下线超时，游戏结束");
      this.engine.stopGame();
    }
  }
}