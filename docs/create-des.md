# 创建依赖
PS: 

**依赖没有规定的项目结构**  
**可以参考仓库的 lib/modules/gameLib/ 内置模块的配置**  
可以先去看 [创建项目](./create-project.md) 对本项目了解后再来观看此教程
### 配置

依赖的重点就是配置了  
配置同样是写在mbler.config.json里面的  
下面是一个示例配置
```json
{
  "name": "GameLib",  // 包名
  "description": "test",  // 描述
  "version": "0.0.1",  // 版本
  "mcVersion": [
    "1.21.10" # 最低支持 mc 版本
    "1.21.100" # 最高支持 mc 版本
  ]
  "type": "scriptsDes",  // 声明此项目为一个脚本依赖包
  "script": {
    "main": "./src/index.js",  // 声明程序入口
    "dependencies":{ 
      "gutils": "inner"  // 声明此脚本依赖的依赖，格式看前面一篇
    }
  }
}
```
然后，你就可以在这个文件夹的 src/index.js 里面用esModule的导出语法写了，因为是直接在Minecraft Bedrock Edition的Sapi解析的，所以不能用commjs导出语法

接下来，你需要使用
```bash

mbler install <该依赖包项目地址>
# 引用依赖
mbler add <依赖名称>
```
下一步，你可以用git发布
 - gitee
 - github
 - gitlab
等平台发布你的脚本依赖包，别人就可以用
```bash
mbler install < git 的 url>
mbler add <包名>
```
获取你的依赖包了