# 用 mbler 创建你的第一个Minecraft行为包
提示: 
** 在仓库里面有 test 这个文件夹，你可以参考这个文件夹里面的配置来编写你的项目 ** 
**建议所有的 json 都不要写注释**
### 第一步
打开终端，请确保你已经安装以下包 :  
 - nodejs 的 node 和 npm
 - git  

这里不需要我说的，自己根据运行环境搜教程去

然后，克隆仓库
```bash
git clone https://gitee.com/n304sc-haoran/mbler.git
cd mbler
```
接下来，你就可以用node运行
** mbler **
在你的终端上了  

比如
```bash
node index.js
```
你也可以用
```bash
npm link
# 如果这一段不行，运行这一段
bash install.sh
```
链接到终端的
** mbler **
命令，快捷启动  
如果你想更新，就
```bash
git pull
```
来拉取最新版本，使用最新特性  
现在，我们在终端上安装了本项目，接下来，就是创建项目了  

### 创建项目

在任意目录创建一个文件夹  
在终端输入
```bash
# 这里默认你已经进行了 npm link 所以直接用mbler命令
mbler -c <你创建的文件夹的路径，相对或绝对均可>
mbler init
```
然后，就会询问一些基本设置  
可以参考 test 项目来修改这个配置  
** 目前支持 typescript **
下面是示例配置介绍
```json
{
  "name": "test",  // 名称
  "description": "test",  // 描述
  "version": "0.1.1",  // 版本
  "mcVersion": "1.21.100",  // 支持的Mc版本，必填，依据此推断Sapi版本
  "script": {
    "ui": true,  // 是否用mcbe的@minecraft/ui模块，启用该模块相当于有ui部分的逻辑
    "main": "main.js",  // 主脚本
    "UseBeta": true, // 是否使用beta版本 script api
    "dependencies": {
      "gameLib": "inner"  // 依赖，gameLib是内置的
      // 格式: <包名>: <源> ，源可以为git仓库链接或 inner : 内置
    }
  },
  "subpack": { // 子包，对应 manifest.json 的subapck
  // 也就是添加包的时候设置页面
  // 在 /subpack/pack-id 里面放文件，和外面结构一样
    "pack-id": "显示的名称"
  },
  "minify": true, // 是否进行代码压缩，目前压缩包含JSON和JavaScript的
  "outdir": "<输出目录，建议写绝对路径>"
}
```
对比一下 mcbe 的原生配置
```json
{
  "format_version": 2,
  "header": {
    "description": "作者:KarZex,汉化:B站Minecraft菠萝君",
    "name": "[菠萝汉化]§g拔刀剑V3.2",
    "min_engine_version": [1, 21, 60 ],
    "uuid": "534fa891-c8a4-46fa-816b-94d70f63bfd4",
    "version": [1, 21, 60]
  },
  "modules": [
    {
      "description": "Data Module",
      "type": "data",
      "uuid": "4f62761d-c0d4-4a5b-a2bc-4f0cfe31a47c",
      "version": [1, 0, 0]
    },
    {
      "description": "Script API Module",
      "language": "javascript",
      "type": "script",
      "uuid": "68d538a2-71a5-41c7-8405-0e1eb60b9037",
      "version": [1, 0, 0],
      "entry": "scripts/bladeMain.js"
    }
  ],
  "capabilities": ["script_eval"],
  "dependencies": [
    {
      "module_name": "@minecraft/server",
      "version": "1.13.0"
    },
    {
      "module_name": "@minecraft/server-ui",
      "version": "1.2.0"
    }
  ]
}

```
明显原生繁琐，选项少  
依赖操作 : 
```bash
# 从指定地方安装依赖
mbler install <git的ssh或https链接 | 本地路径>
# 在工作目录添加依赖
mbler add <依赖的包名>
# 在工作目录删除依赖
mbler remove <依赖的包名>
```
创建依赖 : [依赖创建](./create-des.md)  

注意 : 文件目录下有package.json，但不需要你npm install  
因为我们只有编译typescript时用到node_modules  
并且由于项目结构关系，编译时先要预整理项目结构，我们并不能直接编译typescript  
所以，我们在第二部，复制package.json，在编译目录再自动npm install  

### 附页
**mbler的项目结构 : **

```
 project
  | package.json # 让npm识别，不需要npm install
  | mbler.config.json 
  | scripts
    | *.js | *.json
  | res
    | pack_icon.png
    | items
      | *.json # 和原版一样
    | entities
      | *.json # 和原版一样
    | recipes
      | *.json # 和原版一样
    | animation_controllers
      | *.json # 和原版一样
    | spawn_rules
      | *.json # 和原版一样
    | functions
      | *.mcfunction # 和原版一样
    | loot_tables
      | *.json # 和原版一样
    | blocks
      | *.json # 和原版一样
    | texts
      | *.lang #和原版一样
  | subpack
    | * # 在 mbler.config.json 里面声明
      | # 和上层一样的结构，只不过少了 mbler.config.json 和subpacks (你在想子包的子包？原版不支持)
```