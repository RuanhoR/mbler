const fs = require('fs/promises')
const path = require('path')

async function isDirectory(filePath) {
  let i;
  try {
    i = await fs.stat(filePath)
    return i.isDirectory()
  } catch {}
  return false
}
module.exports = async function({
  param,
  DATA,
  query
}) {
  const i = query.get('name')
  if (!i || i.includes('../')) return {
    data: []
  }
  try {
    const ResDir = path.join(param, i)
    let content = await fs.readdir(ResDir)
    content = (await Promise.all(
      content.map(async (item) => {
        return {
          name: item,
          isdir: await isDirectory(path.join(ResDir, item))
        }
      })
    ))
    return {
      data: content
    }
  } catch (err) {
    console.error(err)
    return {
      data: []
    }
  }
}