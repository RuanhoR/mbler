# 内置依赖说明
**mbler的依赖系统不复用npm，而是高度自定义**  
内置依赖和自主下载的依赖存储在仓库的 lib/modules 文件夹  
下面是分方面介绍内置依赖
### 使用
** 这里用create-game内置依赖做演示 **
在你的mbler项目的mbler.config.json里面的script.dependencies添加一项 : 
> "create-game": "inner"

或者使用
```bash
mbler add create-game
```
### create-game

此依赖复用[github](https://github.com/XiaoYangx666/SAPI-Game)
注 : 教程里面的导入语句是这样的
```javascript
import { initSAPIGame } from "@sapi-game/main";
```
使用mbler构建则需写成
```javascript
import { initSAPIGame } from "create-game";
```
### gameLib

这是一个为mcbe原生操作提供便利的依赖包  
使用的话先看源码，文档待会写

### gutils
这是一个内置依赖的工具，还没写完