SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
npm i
cd $PATH
rm -rf mbler
echo "#!/usr/bin/env node
require('$SCRIPT_DIR/bin/mbler')" > mbler
chmod +x mbler