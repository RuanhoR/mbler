export default { commit: `commit 58b1b36e3c979cdad8f2d7d832f43bb75e3471d3
Author: Ruanhor <3915264929@qq.com>
Date:   Sun Mar 29 16:17:44 2026 +0800

    chore: 升级依赖并修复 TTY 检测
    
    - 升级 @mbler/mcx-core 依赖至 0.0.4-beta.r1
    - 重构 TSC 插件逻辑，使用核心库提供的 LanguagePlugin 工厂方法
    - 修复 commander 在非 TTY 环境下调用 setRawMode 导致的错误
    - 为 CLI 入口文件添加 shebang 并赋予执行权限
    - 优化 WorkDirManage 模块的 import 语句结构
    - 更新版本号至 0.1.9-beta.r1
`, version: "0.1.9-beta.r2" }