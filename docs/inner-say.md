# 内置依赖说明
**mbler的依赖系统不复用npm，而是高度自定义**  
内置依赖和自主下载的依赖存储在仓库的 lib/modules 文件夹  
下面是分方面介绍内置依赖
## 使用
** 这里用create-game内置依赖做演示 **
在你的mbler项目的mbler.config.json里面的script.dependencies添加一项 : 
> "create-game": "inner"

或者使用
```bash
mbler add create-game
```
## create-game

此依赖复用[github](https://github.com/XiaoYangx666/SAPI-Game)
注 : 教程里面的导入语句是这样的
```javascript
import { initSAPIGame } from "@sapi-game/main";
```
使用mbler构建则需写成
```javascript
import { initSAPIGame } from "create-game";
```
## gameLib

这是一个为mcbe原生操作提供便利的依赖包  
### 示例 
使用方法 : 声明后导入主类
```javascript
import {
  GameLib
} from "gameLib"
const game = new GameLib(true) // 这里传入的布尔值表示是否进行调试性日志
```
这里的game就是gameLib的主要内容
目前，他有很多功能
如，` event ` 分类
```javascript
const {
  event
} = game;
// 注册玩家
const {
  id: EventId
} = event.PlayerAdd((event)=>{
  event.player.sendMessage('欢迎玩家加入')
}, '>')
// 第二个参数 : '<' 表示事件之后执行，'>' 表示事件之前执行，部分事件不需要，因为原版限制

// 取消监听事件
game.stop(EventId)

// 计时器事件

const {
  id: TimerId
} = event.setTimer(()=>{
  console.log('0.5秒后执行，不循环')
}, 10, false)
// 三个参数 : 第一个是执行的函数，第二个是间隔，第三个是是否循环

// 同样这样停止计时器
event.stop(TimerId)
// 注意 : 单个game实例的事件不能跨文件解除监听，除非你把这里的event也导出到目标文件
```
OK，看完了event子分类的使用实例，那么我们来看看方法表
### 事件注册方法
支持第二个参数调事件执行前后触发的有
 - UseItem (玩家使用物品)
 - BreakB (玩家破坏方块)
 - PlayerAdd (玩家加入)

不支持的有
 - EntityHitE (实体攻击实体)
 - EntityHitB (实体挖掘方块中)
 - EntityDie (实体死亡)
 - EntityAdd (实体生成)
 - WatchDogStop (看门狗终止事件)

### ui 类
示例
```javascript
const {
  createForm
} = game;
game.event.UseItem((event)=>{
  createForm("Action", {
    layout: [{
      type: "button",
      param: ["text"]
    }],
    type: 
    title: ""
  })
    .show(event.player)
}, '<')
```
## gutils
这是一个内置依赖的工具，还没写完