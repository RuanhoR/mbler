import {
  RegionEventType,
} from "./../../gameEvent/events/regionEvents";
import {
  Game
} from "./../../main";
import {
  GameComponent
} from "../gameComponent";
import {
  GameMode
} from "@minecraft/server";
/**区域队伍选择器 */
export class RegionTeamChooser extends GameComponent {
  onAttach() {
    if (!this.options)
      return;
    this.options.config.forEach((data) => {
      this.subscribe(Game.events.region, (event) => this.handleRegionEvent(event, data), data.region);
    });
  }
  handleRegionEvent(event, data) {
    const gamePlayer = this.state.playerManager.get(event.player);
    if (!gamePlayer.isValid) {
      if (event.player.isValid) {
        event.player.sendMessage("暂时无法进入队伍");
      }
      return;
    }
    switch (event.type) {
      case RegionEventType.Enter:
        this.handlePlayerEnter(gamePlayer, data);
        break;
      case RegionEventType.Leave:
        this.handlePlayerLeave(gamePlayer, data);
        break;
    }
  }
  handlePlayerEnter(gamePlayer, configData) {
    //不允许旁观者直接返回
    if ((this.options.allowSpectator ?? true) &&
      gamePlayer.player?.getGameMode() == GameMode.Spectator) {
      return;
    }
    const newTeam = configData.team;
    const alreadyInTeam = newTeam.has(gamePlayer);
    if (configData.onEnter) {
      configData.onEnter(gamePlayer);
    }
    //从所有队伍清除目标玩家
    this.options?.config.forEach((d) => {
      if (d.team !== newTeam) {
        d.team.delete(gamePlayer);
      }
    });
    //添加到新队伍
    newTeam.add(gamePlayer);
    //执行回调
    if (configData.onJoin && !alreadyInTeam) {
      configData.onJoin(gamePlayer);
    }
  }
  handlePlayerLeave(gamePlayer, configData) {
    const shouldRemoveOnLeave = this.options?.removeOnLeave ?? false;
    if (shouldRemoveOnLeave) {
      configData.team.delete(gamePlayer);
    }
  }
  onDetach() {
    super.onDetach();
    if (this.options) {
      this.options.config.forEach((t) => t.team.clearInvalid());
    }
  }
}