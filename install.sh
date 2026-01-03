SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
npm i
cd $PATH
HEADER="#!/usr/bin/env node\n"
rm -rf vitepress
echo "$HEADER import('/data/data/com.termux/files/usr/lib/node_modules/vitepress/bin/vitepress.js')" > vitepress
chmod +x vitepress