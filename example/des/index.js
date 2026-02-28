exports.main = async function main(content) {
  const name = await MblerApi.input("名称")
  const desc = await MblerApi.input(`描述 `)
  const main = await MblerApi.input(`主脚本 `)
  content.setWorkDir
    .writeFile("./mbler.config.json", JSON.stringify({
    name,
    description: desc,
    script: {
      main: "src/index.js",
      dependencies: {}
    },
    type: "scriptsDes",
    version: "0.0.1",
    mcVersion: [
      "1.21.00",
      "1.21.100"
    ]
  }, null, 2))
}