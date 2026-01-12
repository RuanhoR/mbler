const Init = require("./../start/init");
const Build = require("./../build/index");
const path = require("node:path");
const init = require("./../start/init");

!async function() {
  // try build test package
  const ProjectDir = path.join(__dirname, "../../")
  const build = new Build(path.join(ProjectDir, "test/mbler-int"), ProjectDir)
  // verify them is not null
  if (!build || !init) {
    throw new TypeError("load build or init")
  }
  await build.build()
}()