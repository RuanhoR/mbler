SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd $PATH
rm -rf mbler
echo "#!/usr/bin/env node
require('$SCRIPT_DIR/index.js')" > mbler
chmod +x mbler