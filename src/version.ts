export default { commit: `commit b194fa371189b60cda2f154ad7708168adb928a2
Author: Ruanhor <3915264929@qq.com>
Date:   Sun Mar 1 12:38:01 2026 +0800

    refactor: add utility functions for player and block data handling
    
    - Implemented \`DataToplayer\` to retrieve players based on conditions.
    - Added \`DateToblock\` to get block data from specified dimensions.
    - Created \`playerToData\` for converting player objects to data format.
    - Introduced type verification methods for entity objects and effects.
    - Added utility functions for checking number ranges and iterators.
    
    refactor: streamline index.js imports and configuration
    
    - Updated import statements in \`index.js\` for clarity.
    - Added language specification in \`mbler.config.json\`.
    - Included \`@minecraft/server\` as a dev dependency in \`package.json\`.
    
    chore: update package and lock files
    
    - Added \`pnpm-lock.yaml\` for dependency management.
    - Removed unused Babel dependencies and added \`tslib\`.
    
    fix: improve rollup configuration and build process
    
    - Adjusted rollup configuration for better path handling.
    - Enhanced build process with error handling and logging improvements.
    - Updated CLI commands to include build and watch functionalities.
    
    docs: update i18n files for new commands
    
    - Added English and Chinese translations for build and watch commands.
    
    style: clean up code formatting and structure
    
    - Improved code readability and consistency across various files.
`, version: "0.1.8-beta.20260329" }