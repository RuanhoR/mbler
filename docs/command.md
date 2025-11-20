# 命令用法  
PS : 
**每次都输入node index.js 很麻烦，你可以在git pull后npm bin一下，然后就能用mbler代替了，不行的话自己查**  
**BETA标识标识还未做好**
| 命令 | 格式 | 别名 | 介绍 |
| --- | --- | --- | --- |
| checkout | node index.js checkout <PATH \| null> | -c | PATH为null时查看工作目录，为目录时切换 |
| build | mbler build  | bulid | 打包工作目录 |
| init | mbler init | -i | 初始化工作目录 |
| version | mbler version | 无 | 查看工作目录包版本 |
| v | mbler v | -v | 查看工具版本 |
| clean | mbler clean | cln | 清空构建痕迹 |
| web_edit | mbler web_edit | 无 | {BETA}打开本地网页代码编辑器 |
| install | mbler install <git链接 \| 本地目录> | 无 | 从 git url或本地目录安装脚本依赖 |
| add | mbler add <包名> | 无 | 在工作目录添加脚本依赖的声明 |
| remove | mbler remove <包名> | 无 | 在工作目录删除脚本依赖的声明 |
| uninstall | mbler uninstall <包名> | 无 | 删除依赖本身 |
| dev | mbler dev | 无 | 开启监测修改实时编译开发模式 |