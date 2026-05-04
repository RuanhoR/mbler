import path from "node:path";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
// import from built distribution instead of source code
import { build, watch, Build } from "mbler/build";
import { i18n, cli } from "mbler";
async function testBuild() {
  const builder = await build({
    params: [],
    opts: {}
  }, path.resolve("../../example/"))
}