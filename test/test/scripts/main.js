import {
  initSAPIGame
} from "create-game"
initSAPIGame({
    debugMode: true, //debugMode开关
    onEnd: onEnd, //执行/game end时触发
    hub: Hub, //玩家执行/hub时触发
    onJoin(p) {
      console.log('player join')
    },
});