export default { commit: `commit 5f659254585e94b76cffd690d18fc2f1fad5b475
Author: ruanhor <3915264929@qq.com>
Date:   Mon May 18 20:24:34 2026 +0800

    feat: enhance build cache management and configuration
    
    - Updated BuildCacheManager to allow custom cache paths and improved mode resolution logic.
    - Modified Build class to pass cachePath from buildConfig to BuildCacheManager.
    - Enhanced rollup plugin configuration to include external dependencies from buildConfig.
    - Improved error handling and logging in various build processes.
    - Refactored CLI commands to remove unused parameters and streamline code.
    - Updated MblerBuildConfig interface to include rollupExternal and cachePath properties.
    - Enhanced ReadProjectMblerConfig to fallback to package.json for name and version.
`, version: "0.2.4-rc.6" }