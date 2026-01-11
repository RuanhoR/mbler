const Init = require("./../start/init");
const Build = require("./../build/index");
const path = require("node:path");
const init = require("./../start/init");
// verify them is not null
if (!build || !init) {
  throw new TypeError("load build or init")
}
// try build test package
const ProjectDir = path.join(__dirname, "../../")
const build = new Build(path.join(ProjectDir, "test/mbler-int"), ProjectDir)
!async function(){
  await build.build()
  new init(path.join(ProjectDir, "test"), ProjectDir)
}()