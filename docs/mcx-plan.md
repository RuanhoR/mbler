# 计划中 mcx 单文件JSON或事件格式
使用该格式，你首先应将mbler.config.json中的script.main指定为index，然后，在index.js里面
```javascript
import App from "./app.mcx"
import {
  createApp
} from "@mbler/mcx"
import {
  world,
  system
} from "@minecraft/server"
createApp(App).mount(world, system);
```
这里参考了`Vue`  
然后在 app.mcx 里面
```mcx
<script lang=js>
import event from "./event.mcx"
import Component from "./component.mcx"
event.subscribe();
console.log(event.isSubscribe ? "成功注册事件" : event.err);
Component.use();
</script>
```
`utlis.mcx`
```mcx
<Event>
  PlayerJoinAfter=eventJoin
</Event>
<script>
  export.eventJoin=function(event) {
    event.player.sendMessage("欢迎进入游戏")
  }
</script>
```
`component.mcx`
```mcx
<Component>
  <items> <!--注册物品-->
    <item name=test>subscribe</item>
  </items>
</Component>
<script>
  import {
    ItemComponent
  } from "@mbler/mcx"
  export.subscribe = new ItemComponent({
    id: "mbler_test:test",
    opt: {
      stacked_by_data: true,
      max_stack_size: true,
      display_name: "测试物品",
      allow_off_hand: true,
      hand_equipped: true,
      foil: true,
      glint: true
    }
  })
</script>
```
这样，你就通过mcx创建了一个物品(该功能规划中，未实现完成，因为过于复杂，要ast解析，要沙盒代码执行)  

像物品组件定义这种是要在打包的时候进行编译的，把组件编译成静态json放到对应文件夹，然后要生成一个主js，事件啥的要作为ast加入这个js，最终像vue一样生成一个超长文件，包括node_modules
  
此功能暂未实现