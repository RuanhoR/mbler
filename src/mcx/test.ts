
import MCX from "."
import path from "node:path"
export default async function test() {
  const testPath = path.join(__dirname, "./tezt")
  await MCX.load({
    ProjectDir: testPath,
    cacheDir: path.join(testPath, ".cache"),
    isCache: true,
    moduleDir: path.join(testPath, "node_modules"),
    output: path.join(testPath, "dist"),
    moduleList: [],
    config: {},
    main: "./main.js"
  })
}